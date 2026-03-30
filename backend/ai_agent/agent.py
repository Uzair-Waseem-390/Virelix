"""
ai_agent/agent.py
──────────────────
ERP Module Analysis Agent.

Responsibilities:
  - Accept a business description string
  - Use the caller's Gemini API key (decrypted on the fly, never stored here)
  - Return an ERPModuleConfig with exactly three boolean fields
  - Never hallucinate extra modules - the schema enforces the contract
  - Run synchronously inside a Celery worker task (see tasks.py)

Design:
  - Agent class is stateless after __init__; one instance per task invocation
  - Uses openai-agents SDK with Gemini via OpenAI-compatible endpoint
  - Pydantic schema is passed to output_type to guarantee structured output
  - System prompt is locked - agent cannot output free text
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from dotenv import load_dotenv

# Django settings must be loaded before this module is imported
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

# Disable SDK tracing noise in production
set_tracing_disabled(True)

logger = logging.getLogger(__name__)

# Gemini OpenAI-compatible base URL - read once at module load
GEMINI_BASE_URL: str = getattr(settings, "GEMINI_BASE_URL", "")


# ── System prompt ─────────────────────────────────────────────────────────────
# This is the ONLY instruction the agent gets.
# It is deliberately restrictive to prevent hallucinations.

_SYSTEM_PROMPT = """
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


# ── Agent class ───────────────────────────────────────────────────────────────

class ERPAnalysisAgent:
    """
    Stateless agent wrapper. Create one per task invocation.
    The gemini_api_key is the DECRYPTED plaintext key - decryption is done
    by the caller (task layer) via accounts.services.crypto.decrypt_api_key.
    """

    def __init__(self, gemini_api_key: str) -> None:
        if not gemini_api_key or not gemini_api_key.strip():
            raise ValueError("A valid Gemini API key is required to run the ERP agent.")
        if not GEMINI_BASE_URL:
            raise RuntimeError(
                "GEMINI_BASE_URL is not configured in settings. "
                "Add it to your .env file."
            )

        self._api_key = gemini_api_key.strip()
        self._client  = self._build_client()

    def _build_client(self) -> AsyncOpenAI:
        return AsyncOpenAI(
            api_key  = self._api_key,
            base_url = GEMINI_BASE_URL,
        )

    def _build_model(self, lite: bool = False) -> OpenAIChatCompletionsModel:
        """
        Returns a Gemini model instance.
        lite=True uses gemini-2.5-flash-lite for speed/cost savings.
        lite=False uses gemini-2.5-flash for accuracy (default for ERP analysis).
        """
        model_name = "gemini-2.5-flash-lite" if lite else "gemini-2.5-flash"
        return OpenAIChatCompletionsModel(
            openai_client = self._client,
            model         = model_name,
        )

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
            instructions = _SYSTEM_PROMPT,
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
        
    # ✅ NEW METHOD: Strict JSON output
    # def analyze_to_json(self, description: str) -> str:
    #     config = self.analyze(description)

    #     # Convert to STRICT JSON string
    #     return config.model_dump_json()
    #     print("Json output: ", config.model_dump_json())
      

# ── Module-level convenience function ─────────────────────────────────────────
# Called by the Celery task. Keeps the task file clean.

def analyze_description(decrypted_api_key: str, description: str) -> ERPModuleConfig:
    """
    Entry point used by tasks.py.
    Raises ValueError / RuntimeError on misconfiguration or bad input.
    All other exceptions (network, auth) propagate to Celery for retry logic.
    """
    agent = ERPAnalysisAgent(gemini_api_key=decrypted_api_key)
    return agent.analyze(description)