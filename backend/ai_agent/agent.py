"""
ai_agent/agent.py
──────────────────
Two agents live here:

  ERPAnalysisAgent      (stateless, runs once via Celery, configures project modules)
  BusinessAnalystAgent  (stateful per chat, answers live ERP queries for a project)

BusinessAnalystAgent design:
  - Accepts a Gemini API key (decrypted by the caller) and a project_id.
  - Three @function_tool tools query the DB ONLY for the given project_id.
    Tools are plain synchronous functions; Runner.run_sync calls them directly.
  - chat(history, user_message) rebuilds the conversation context from persisted
    history, appends the new user message, and runs the agent.
  - Returns the assistant reply as a plain string.
  - Never instantiates a new DB connection - uses Django ORM (already open).

Tool scoping:
  All three tools receive project_id via closure (captured in __init__).
  They cannot query data from other projects; no additional auth check needed
  inside the tool because the closure is set by the service layer after
  verifying the user is a project member.
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from django.conf import settings

from agents import (
    Agent,
    AgentOutputSchema,
    AsyncOpenAI,
    OpenAIChatCompletionsModel,
    Runner,
    function_tool,
    set_tracing_disabled,
)

from ai_agent.schemas import ERPModuleConfig

# Disable SDK tracing noise in production
set_tracing_disabled(True)

logger = logging.getLogger(__name__)

# Gemini OpenAI-compatible base URL - read once at module load
GEMINI_BASE_URL: str = getattr(settings, "GEMINI_BASE_URL", "")


# ── System prompts ─────────────────────────────────────────────────────────────

_ERP_SYSTEM_PROMPT = """
You are an ERP Module Configurator. Your ONLY job is to read a business description
and decide which of these three ERP modules the business needs:

  1. products  - The business manages, sells, or tracks products/items.
  2. inventory - The business tracks stock levels, warehouse, or stock movement.
  3. sales     - The business processes customer orders, invoices, or transactions.

Rules (follow strictly, no exceptions):
  - Output ONLY a JSON object with exactly three keys: "products", "inventory", "sales".
  - Each key must be a boolean: true or false.
  - Do NOT add any other keys, explanations, or text outside the JSON.
  - A business that sells products almost always needs inventory too.
  - A business that has sales almost always needs products too.
  - If the description mentions "ERP", "enterprise", "business management", or "management system"
    for a business that deals with goods/trade, enable all three modules.
  - Only return all-false if the business is clearly non-commercial (e.g. HR-only, internal IT,
    non-profit admin) with no products, stock, or customer transactions involved.
  - When in doubt for a commercial business, lean towards enabling relevant modules.

Examples:
  Description: "We run a retail clothing store"
  Output: {"products": true, "inventory": true, "sales": true}

  Description: "I want a simple ERP system"
  Output: {"products": true, "inventory": true, "sales": true}

  Description: "I want an ERP system for my shop"
  Output: {"products": true, "inventory": true, "sales": true}

  Description: "We provide IT consulting services"
  Output: {"products": false, "inventory": false, "sales": true}

  Description: "We manufacture and wholesale furniture"
  Output: {"products": true, "inventory": true, "sales": true}

  Description: "Internal HR management system"
  Output: {"products": false, "inventory": false, "sales": false}
""".strip()


_ANALYST_SYSTEM_PROMPT = """
You are a Business Analyst assistant for an ERP system. You help project members
understand their business performance by analysing live data from the project's
sales, products, and inventory.

Capabilities:
  - Fetch and compare sales data (monthly revenue, order counts, trends)
  - List and analyse products (pricing, categories, availability)
  - Check inventory health (stock levels, low-stock alerts, stock value)

Rules:
  - ALWAYS use the provided tools to fetch data before answering. Never guess figures.
  - When comparing periods (e.g. "last 2 months"), call get_sales_data with an
    appropriate number of months and break down the comparison clearly.
  - Respond in clear, concise business language. Use bullet points or tables where helpful.
  - If a module has no data yet, say so politely instead of returning an error.
  - Never reveal internal implementation details (project IDs, DB structure, etc.).
  - You are scoped to ONE project. You cannot access data from other projects.
""".strip()


# ── Shared client / model builder ─────────────────────────────────────────────

def _make_client(api_key: str) -> AsyncOpenAI:
    if not GEMINI_BASE_URL:
        raise RuntimeError(
            "GEMINI_BASE_URL is not configured in settings. "
            "Add it to your .env file."
        )
    return AsyncOpenAI(api_key=api_key.strip(), base_url=GEMINI_BASE_URL)


def _make_model(client: AsyncOpenAI, lite: bool = False) -> OpenAIChatCompletionsModel:
    model_name = "gemini-2.5-flash-lite" if lite else "gemini-2.5-flash"
    return OpenAIChatCompletionsModel(openai_client=client, model=model_name)


# ── ERPAnalysisAgent ──────────────────────────────────────────────────────────

class ERPAnalysisAgent:
    """
    Stateless agent wrapper. Create one per task invocation.
    The gemini_api_key is the DECRYPTED plaintext key - decryption is done
    by the caller (task layer) via accounts.services.crypto.decrypt_api_key.
    """

    def __init__(self, gemini_api_key: str) -> None:
        if not gemini_api_key or not gemini_api_key.strip():
            raise ValueError("A valid Gemini API key is required to run the ERP agent.")
        self._api_key = gemini_api_key.strip()
        self._client  = _make_client(self._api_key)

    def _build_model(self, lite: bool = False) -> OpenAIChatCompletionsModel:
        return _make_model(self._client, lite=lite)

    # ── Public interface ──────────────────────────────────────────────────────

    def analyze(self, description: str) -> ERPModuleConfig:
        """
        Synchronous analysis. Runs inside a Celery worker.
        Returns ERPModuleConfig on success, raises on failure.
        """
        if not description or not description.strip():
            raise ValueError("Project description cannot be empty.")

        agent = Agent(
            name         = "ERP Module Configurator",
            model        = self._build_model(lite=False),
            instructions = _ERP_SYSTEM_PROMPT,
            output_type  = AgentOutputSchema(ERPModuleConfig, strict_json_schema=False),
        )

        logger.info("ERP agent starting analysis for description: %.80s...", description)

        result = Runner.run_sync(
            starting_agent = agent,
            input          = description.strip(),
        )

        config: ERPModuleConfig = result.final_output

        logger.info(
            "ERP agent finished. Enabled modules: %s",
            config.enabled_modules(),
        )

        return config


# ── BusinessAnalystAgent ───────────────────────────────────────────────────────

class BusinessAnalystAgent:
    """
    Stateful Business Analyst agent for a specific project.

    Create one instance per request (not per chat). The project_id is used to
    scope all three DB-querying tools so the agent ONLY sees data from that
    project, regardless of what the user asks.

    gemini_api_key: decrypted plaintext key from the project's admin user.
    project_id:     PK of the project being analysed.
    """

    def __init__(self, gemini_api_key: str, project_id: int) -> None:
        if not gemini_api_key or not gemini_api_key.strip():
            raise ValueError("A valid Gemini API key is required.")
        self._api_key   = gemini_api_key.strip()
        self._project_id = project_id
        self._client    = _make_client(self._api_key)

    def _build_model(self) -> OpenAIChatCompletionsModel:
        return _make_model(self._client, lite=False)

    # ── Project-scoped tools ──────────────────────────────────────────────────
    # These are regular (sync) functions decorated with @function_tool.
    # They are defined inside the instance methods so they capture
    # self._project_id through closure - ensuring project isolation.

    def _make_tools(self) -> list:
        project_id = self._project_id  # captured by closure

        @function_tool
        def get_sales_data(months: int = 3) -> str:
            """
            Fetch aggregated monthly sales data for the project.

            Args:
                months: Number of past months to include (default 3, max 24).

            Returns:
                A summary string with monthly confirmed sales counts and revenue.
            """
            from django.utils import timezone
            from django.db.models import Sum, Count
            from dateutil.relativedelta import relativedelta
            from sales.models import Sale, SaleStatus

            months = max(1, min(int(months), 24))
            now    = timezone.now()
            rows   = []

            for i in range(months - 1, -1, -1):
                period_start = (now - relativedelta(months=i)).replace(
                    day=1, hour=0, minute=0, second=0, microsecond=0
                )
                if i == 0:
                    period_end = now
                else:
                    period_end = (now - relativedelta(months=i - 1)).replace(
                        day=1, hour=0, minute=0, second=0, microsecond=0
                    )

                agg = Sale.objects.filter(
                    project_id  = project_id,
                    status      = SaleStatus.CONFIRMED,
                    confirmed_at__gte = period_start,
                    confirmed_at__lt  = period_end,
                ).aggregate(
                    total_revenue = Sum("total_amount"),
                    sale_count    = Count("id"),
                )

                label   = period_start.strftime("%B %Y")
                revenue = agg["total_revenue"] or 0
                count   = agg["sale_count"]   or 0
                rows.append(f"{label}: {count} sales, revenue = {revenue:.2f}")

            if not rows:
                return "No confirmed sales data found for this project."

            return "Monthly Sales Data (confirmed only):\n" + "\n".join(rows)

        @function_tool
        def get_products_data() -> str:
            """
            Fetch the list of active products for the project.

            Returns:
                A summary string listing all active products with name, SKU,
                category, price, and cost price.
            """
            from products.models import Product

            products = Product.objects.filter(
                project_id = project_id,
                is_active  = True,
            ).order_by("name")

            if not products.exists():
                return "No active products found for this project."

            lines = ["Active Products:"]
            for p in products:
                cost = f"cost={p.cost_price:.2f}" if p.cost_price else "cost=N/A"
                sku  = p.sku or "no-SKU"
                cat  = p.category or "uncategorised"
                lines.append(
                    f"  • {p.name} | SKU: {sku} | Category: {cat} | "
                    f"Price: {p.price:.2f} | {cost} | Unit: {p.unit}"
                )

            return "\n".join(lines)

        @function_tool
        def get_inventory_data() -> str:
            """
            Fetch the current inventory snapshot for all products in the project.

            Returns:
                A string listing each product's stock level, location, and
                whether it is low or out of stock.
            """
            from inventory.models import Inventory

            records = Inventory.objects.select_related("product").filter(
                project_id = project_id,
            ).order_by("product__name")

            if not records.exists():
                return "No inventory records found for this project."

            lines = ["Inventory Snapshot:"]
            for inv in records:
                status = ""
                if inv.is_out_of_stock:
                    status = "⚠ OUT OF STOCK"
                elif inv.is_low_stock:
                    status = "⚠ LOW STOCK"
                loc = f" | Location: {inv.location}" if inv.location else ""
                lines.append(
                    f"  • {inv.product.name}: qty={inv.quantity} "
                    f"(threshold={inv.low_stock_threshold}){loc} {status}"
                )

            return "\n".join(lines)

        return [get_sales_data, get_products_data, get_inventory_data]

    # ── Public interface ──────────────────────────────────────────────────────

    def chat(self, history: list[dict], user_message: str) -> str:
        """
        Run the Business Analyst agent with the full conversation history.

        Args:
            history:      List of past turns [{role: str, content: str}, ...].
                          role must be "user" or "assistant".
            user_message: The new message from the human.

        Returns:
            The assistant's reply as a plain string.
        """
        if not user_message or not user_message.strip():
            raise ValueError("User message cannot be empty.")

        tools = self._make_tools()

        agent = Agent(
            name         = "Business Analyst",
            model        = self._build_model(),
            instructions = _ANALYST_SYSTEM_PROMPT,
            tools        = tools,
        )

        # Build the full input string from history + new message.
        # The agents SDK accepts a plain string as input; we inject history
        # into the prompt so the model has conversation context.
        input_text = _build_input_with_history(history, user_message)

        logger.info(
            "BusinessAnalystAgent running for project_id=%s message=%.80s...",
            self._project_id, user_message,
        )

        result = Runner.run_sync(
            starting_agent = agent,
            input          = input_text,
        )

        reply: str = result.final_output if isinstance(result.final_output, str) else str(result.final_output)

        logger.info(
            "BusinessAnalystAgent finished for project_id=%s reply_len=%d",
            self._project_id, len(reply),
        )

        return reply


# ── Private helpers ────────────────────────────────────────────────────────────

def _build_input_with_history(history: list[dict], user_message: str) -> str:
    """
    Serialise conversation history + new user message into a single prompt string.

    Format:
      [CONVERSATION HISTORY]
      User: ...
      Assistant: ...
      ...
      [NEW MESSAGE]
      User: <user_message>
    """
    if not history:
        return user_message.strip()

    parts = ["[CONVERSATION HISTORY]"]
    for turn in history:
        role    = turn.get("role", "user").capitalize()
        content = turn.get("content", "").strip()
        parts.append(f"{role}: {content}")

    parts.append("\n[NEW MESSAGE]")
    parts.append(f"User: {user_message.strip()}")

    return "\n".join(parts)


# ── Module-level convenience functions ────────────────────────────────────────
# Called by tasks.py and service layer. Keeps call sites clean.

def analyze_description(decrypted_api_key: str, description: str) -> ERPModuleConfig:
    """
    Entry point used by tasks.py.
    Raises ValueError / RuntimeError on misconfiguration or bad input.
    All other exceptions (network, auth) propagate to Celery for retry logic.
    """
    agent = ERPAnalysisAgent(gemini_api_key=decrypted_api_key)
    return agent.analyze(description)


def run_analyst_chat(
    decrypted_api_key: str,
    project_id: int,
    history: list[dict],
    user_message: str,
) -> str:
    """
    Entry point used by agent_service.py.
    Returns the assistant reply string.
    """
    agent = BusinessAnalystAgent(
        gemini_api_key = decrypted_api_key,
        project_id     = project_id,
    )
    return agent.chat(history=history, user_message=user_message)