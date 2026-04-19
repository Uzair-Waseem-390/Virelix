"""
ai_agent/agent.py
──────────────────
Two agents live here:

  ERPAnalysisAgent      — stateless, runs once via Celery, configures project modules.
  BusinessAnalystAgent  — stateful per chat, answers live ERP queries for a project.

BusinessAnalystAgent design:
  - Accepts a Gemini API key (decrypted by the caller) and a project_id.
  - Tools are imported from ai_agent/tools.py and bound to project_id via closure.
  - chat(history, user_message) rebuilds context from persisted history and runs
    the agent synchronously via Runner.run_sync.
  - Returns the assistant reply as a plain string.

Tool scoping:
  All tools are created by build_analyst_tools(project_id) which captures project_id
  in a closure. They physically cannot query data from other projects.
"""

from __future__ import annotations

import logging

from django.conf import settings

from agents import (
    Agent,
    AgentOutputSchema,
    AsyncOpenAI,
    OpenAIChatCompletionsModel,
    Runner,
    set_tracing_disabled,
)

from ai_agent.schemas import ERPModuleConfig
from ai_agent.tools import build_analyst_tools

# Disable SDK tracing noise in production
set_tracing_disabled(True)

logger = logging.getLogger(__name__)

# Gemini OpenAI-compatible base URL — read once at module load
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
You are an expert Business Analyst assistant embedded in a real ERP system.
Your job is to answer ANY business question a project member might ask about
their sales, products, and inventory — using live data via your tools.

═══════════════════════════════════════════════════════════
⚠ CRITICAL RULE — READ BEFORE ANYTHING ELSE
═══════════════════════════════════════════════════════════

You MUST only call tools from the exact list below.
NEVER invent tool names like "today", "now", "current_date", "get_date",
"get_time", "get_today", or any other name not in this list.
If you need the current date/time, use get_current_date() — that is the ONLY tool for it.
If you call a tool that is not in the list, the system will crash with an error.

═══════════════════════════════════════════════════════════
TOOLS AVAILABLE — USE ONLY THESE, EXACTLY AS NAMED
═══════════════════════════════════════════════════════════

  get_current_date()
    → Returns today's date, current month, and day of week.
    → Call this FIRST whenever the question mentions: today, yesterday, this month,
      last week, last N months, this year, or any relative time expression.
    → Then use the returned date to build YYYY-MM-DD values for other tools.

  get_sales_data(months)
    → Monthly confirmed sales count + revenue for the last N months.
    → Use for: "last 3 months sales", "monthly trend", "compare months".

  get_sales_by_date_range(start_date, end_date)
    → All confirmed sales between two dates (YYYY-MM-DD format).
    → Use for: "sales in January", "Q1 revenue", "last week's orders".

  get_sales_by_status(sale_status)
    → Sales filtered by status: "draft", "confirmed", or "cancelled".
    → Use for: "pending orders", "how many cancelled sales", "draft count".

  get_sales_by_customer(customer_name)
    → Confirmed sales for a customer (partial name match).
    → Use for: "sales to Ahmed", "how much did Ali buy", "customer history".

  get_sales_by_creator_role(role)
    → Confirmed sales created by users of a given role (admin/manager/staff).
    → Use for: "sales made by staff", "how many sales did manager create".

  get_products_data(include_inactive)
    → Full product catalogue. Pass include_inactive=True to see all products.
    → Shows creator email and role for each product.
    → Use for: "list products", "product prices", "all items including deleted".

  get_products_by_creator_role(role)
    → Products created by users with a specific role (admin/manager/staff).
    → Use for: "which products did staff add", "products created by manager".

  get_products_by_category(category)
    → Products in a matching category. Empty string = list all categories.
    → Use for: "show electronics products", "what categories exist".

  get_top_selling_products(limit)
    → Top N products by total confirmed revenue.
    → Use for: "best sellers", "top 10 products", "most sold item".

  get_inventory_data()
    → Current stock levels, locations, and low-stock/out-of-stock alerts.
    → Use for: "stock levels", "what's in inventory", "inventory status".

  get_low_stock_products()
    → Products at or below their low-stock threshold.
    → Use for: "what needs restocking", "low inventory", "out of stock".

  get_stock_movements(product_name, movement_type, limit)
    → Full audit trail of stock-in, stock-out, and adjustment movements.
    → Use for: "stock history", "when was X restocked", "movements for Y".

  get_revenue_summary()
    → High-level KPIs: total revenue, avg order value, product count, stock value.
    → Use for: "business overview", "KPIs", "how is the business doing".

═══════════════════════════════════════════════════════════
BEHAVIOUR RULES
═══════════════════════════════════════════════════════════

1. ALWAYS call the appropriate tool(s) before answering. Never guess or estimate.
2. For ANY relative time (today, this month, last week…) → call get_current_date() FIRST,
   then derive the YYYY-MM-DD dates, then call the relevant sales/inventory tool.
3. Combine multiple tool calls if the question needs cross-module data.
4. If data is empty, say so clearly — do not say "I cannot do that".
5. You CAN filter by role, date, customer, category, status. You have tools for all of these.
6. NEVER say "I only support X" or "I can't filter by Y" — if a tool exists, use it.
7. After calling tools, add a short analytical interpretation: trends, comparisons,
   warnings (low stock), and recommendations where useful.
8. Use bullet points, tables (markdown), or numbered lists for clarity.
9. Format currency values with 2 decimal places.
10. Never reveal project IDs, database field names, or internal implementation details.
11. You serve ONE project only. You cannot access data from other projects.

═══════════════════════════════════════════════════════════
EXAMPLE QUESTION → TOOL MAPPING
═══════════════════════════════════════════════════════════

  "Show sales made by manager"           → get_sales_by_creator_role("manager")
  "Products added by staff"              → get_products_by_creator_role("staff")
  "Sales this month"                     → get_current_date() → get_sales_by_date_range(...)
  "Compare last 2 months"               → get_sales_data(months=2)
  "Top 5 best sellers + their stock"    → get_top_selling_products(5) + get_inventory_data()
  "What needs restocking?"              → get_low_stock_products()
  "Business KPIs"                       → get_revenue_summary()
  "Stock movements for Product X"       → get_stock_movements("X")
  "How is the business performing?"     → get_revenue_summary()
""".strip()


# ── Shared client / model builders ─────────────────────────────────────────────

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
    The gemini_api_key is the DECRYPTED plaintext key — decryption is done
    by the caller (task layer) via accounts.services.crypto.decrypt_api_key.
    """

    def __init__(self, gemini_api_key: str) -> None:
        if not gemini_api_key or not gemini_api_key.strip():
            raise ValueError("A valid Gemini API key is required to run the ERP agent.")
        self._api_key = gemini_api_key.strip()
        self._client  = _make_client(self._api_key)

    def _build_model(self, lite: bool = False) -> OpenAIChatCompletionsModel:
        return _make_model(self._client, lite=lite)

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

        logger.info("ERP agent finished. Enabled modules: %s", config.enabled_modules())

        return config


# ── BusinessAnalystAgent ───────────────────────────────────────────────────────

class BusinessAnalystAgent:
    """
    Stateful Business Analyst agent for a specific project.

    Tools are imported from ai_agent/tools.py and bound to project_id via closure.
    See tools.py for the full catalogue of 13 tools.

    gemini_api_key : decrypted plaintext key from the project's admin user.
    project_id     : PK of the project being analysed.
    """

    def __init__(self, gemini_api_key: str, project_id: int) -> None:
        if not gemini_api_key or not gemini_api_key.strip():
            raise ValueError("A valid Gemini API key is required.")
        self._api_key    = gemini_api_key.strip()
        self._project_id = project_id
        self._client     = _make_client(self._api_key)

    def _build_model(self) -> OpenAIChatCompletionsModel:
        return _make_model(self._client, lite=False)

    def chat(self, history: list[dict], user_message: str) -> str:
        """
        Run the Business Analyst agent with the full conversation history.

        Args:
            history      : List of past turns [{role: str, content: str}, ...].
            user_message : The new message from the human.

        Returns:
            The assistant's reply as a plain string.
        """
        if not user_message or not user_message.strip():
            raise ValueError("User message cannot be empty.")

        # All 13 tools, scoped to this project_id
        tools = build_analyst_tools(self._project_id)

        agent = Agent(
            name         = "Business Analyst",
            model        = self._build_model(),
            instructions = _ANALYST_SYSTEM_PROMPT,
            tools        = tools,
        )

        input_text = _build_input_with_history(history, user_message)

        logger.info(
            "BusinessAnalystAgent running — project_id=%s message=%.80s...",
            self._project_id, user_message,
        )

        result = Runner.run_sync(
            starting_agent = agent,
            input          = input_text,
        )

        reply: str = (
            result.final_output
            if isinstance(result.final_output, str)
            else str(result.final_output)
        )

        logger.info(
            "BusinessAnalystAgent finished — project_id=%s reply_len=%d",
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

def analyze_description(decrypted_api_key: str, description: str) -> ERPModuleConfig:
    """Entry point used by tasks.py."""
    agent = ERPAnalysisAgent(gemini_api_key=decrypted_api_key)
    return agent.analyze(description)


def run_analyst_chat(
    decrypted_api_key: str,
    project_id: int,
    history: list[dict],
    user_message: str,
) -> str:
    """Entry point used by agent_service.py."""
    agent = BusinessAnalystAgent(
        gemini_api_key = decrypted_api_key,
        project_id     = project_id,
    )
    return agent.chat(history=history, user_message=user_message)