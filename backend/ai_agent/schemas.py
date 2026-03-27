"""
ai_agent/schemas.py
────────────────────
Pydantic output schema for the ERP module analysis agent.

The agent MUST return exactly this structure.
Only three modules are valid: products, inventory, sales.
Hallucinations are controlled by:
  1. Strict field typing (bool, no Optional)
  2. A locked system prompt that lists only these three keys
  3. max_retries on the runner so malformed output is retried, not propagated
"""

from pydantic import BaseModel, Field


class ERPModuleConfig(BaseModel):
    """
    The ONLY output the agent is allowed to produce.

    Every field is a plain bool - no null, no extra keys.
    If the business description does not mention a module, it defaults to False.
    """

    products: bool = Field(
        default=False,
        description=(
            "Enable Products module. Set True when the business sells, "
            "manufactures, or manages physical or digital products/items."
        ),
    )
    inventory: bool = Field(
        default=False,
        description=(
            "Enable Inventory / Stock module. Set True when the business "
            "needs to track stock levels, stock-in / stock-out, or warehousing."
        ),
    )
    sales: bool = Field(
        default=False,
        description=(
            "Enable Sales module. Set True when the business processes "
            "customer orders, invoices, or sales transactions."
        ),
    )

    # ── Convenience ──────────────────────────────────────────────────────────

    def any_enabled(self) -> bool:
        """Returns True if at least one module is enabled."""
        return self.products or self.inventory or self.sales

    def enabled_modules(self) -> list[str]:
        """Returns list of enabled module names, e.g. ['products', 'sales']."""
        result = []
        if self.products:
            result.append("products")
        if self.inventory:
            result.append("inventory")
        if self.sales:
            result.append("sales")
        return result

    def to_project_fields(self) -> dict:
        """
        Returns a dict ready to be passed as **kwargs to Project.objects.create()
        or Project.objects.filter().update().
        Maps to the Project model's has_products / has_inventory / has_sales fields.
        """
        return {
            "has_products":  self.products,
            "has_inventory": self.inventory,
            "has_sales":     self.sales,
        }