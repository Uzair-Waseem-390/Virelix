"""
ai_agent/tools.py
──────────────────
All BusinessAnalystAgent tools live here.

Design rules:
  - Every tool is a factory function that captures `project_id` via closure,
    ensuring all DB queries are strictly scoped to one project.
  - Call `build_analyst_tools(project_id)` to get the list of bound tools to
    pass to the Agent.
  - Tools are plain synchronous functions decorated with @function_tool.
    The agents SDK (Runner.run_sync) calls them directly.
  - All imports are deferred (inside the tool body) to avoid circular imports
    at module load time.
  - Tools return human-readable strings — the agent formats the final answer.
"""

from __future__ import annotations

from agents import function_tool


# ─────────────────────────────────────────────────────────────────────────────
# Factory — call this once per agent instantiation
# ─────────────────────────────────────────────────────────────────────────────

def build_analyst_tools(project_id: int) -> list:
    """
    Return a list of all analyst tools, each scoped to `project_id` via closure.
    Import this function in agent.py and call it inside _make_tools().
    """

    # ── 1. Monthly sales summary ──────────────────────────────────────────────

    @function_tool
    def get_sales_data(months: int = 3) -> str:
        """
        Get aggregated monthly sales data (confirmed orders only).

        Args:
            months: How many past months to include. Default 3, max 24.

        Returns:
            Monthly breakdown of sale count and total revenue.
        """
        from django.utils import timezone
        from django.db.models import Sum, Count
        from dateutil.relativedelta import relativedelta
        from sales.models import Sale, SaleStatus

        months = max(1, min(int(months), 24))
        now    = timezone.now()
        rows: list[str] = []

        for i in range(months - 1, -1, -1):
            period_start = (now - relativedelta(months=i)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            period_end = now if i == 0 else (now - relativedelta(months=i - 1)).replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )

            agg = Sale.objects.filter(
                project_id       = project_id,
                status           = SaleStatus.CONFIRMED,
                confirmed_at__gte= period_start,
                confirmed_at__lt = period_end,
            ).aggregate(
                total_revenue=Sum("total_amount"),
                sale_count   =Count("id"),
            )

            label   = period_start.strftime("%B %Y")
            revenue = agg["total_revenue"] or 0
            count   = agg["sale_count"]    or 0
            rows.append(f"{label}: {count} confirmed sales | revenue = {revenue:.2f}")

        return (
            "Monthly Sales Summary (confirmed only):\n" + "\n".join(rows)
            if rows else "No confirmed sales found for this project."
        )

    # ── 2. Sales in a custom date range ───────────────────────────────────────

    @function_tool
    def get_sales_by_date_range(start_date: str, end_date: str) -> str:
        """
        Get all confirmed sales between two dates (inclusive).

        Args:
            start_date: Start date in YYYY-MM-DD format.
            end_date:   End date   in YYYY-MM-DD format.

        Returns:
            List of sales with customer, amount, and date.
        """
        from datetime import datetime
        from django.utils import timezone
        from sales.models import Sale, SaleStatus

        try:
            start = timezone.make_aware(datetime.strptime(start_date, "%Y-%m-%d"))
            end   = timezone.make_aware(datetime.strptime(end_date,   "%Y-%m-%d").replace(
                hour=23, minute=59, second=59
            ))
        except ValueError:
            return "Invalid date format. Use YYYY-MM-DD."

        sales = Sale.objects.filter(
            project_id       = project_id,
            status           = SaleStatus.CONFIRMED,
            confirmed_at__gte= start,
            confirmed_at__lte= end,
        ).order_by("confirmed_at")

        if not sales.exists():
            return f"No confirmed sales between {start_date} and {end_date}."

        lines = [f"Sales from {start_date} to {end_date}:"]
        total_rev = 0
        for s in sales:
            date_str  = s.confirmed_at.strftime("%Y-%m-%d") if s.confirmed_at else "?"
            customer  = s.customer_name or "Walk-in"
            lines.append(f"  • {date_str} | {customer} | {s.total_amount:.2f}")
            total_rev += s.total_amount or 0

        lines.append(f"\nTotal: {sales.count()} sales | Revenue: {total_rev:.2f}")
        return "\n".join(lines)

    # ── 3. Sales by status ────────────────────────────────────────────────────

    @function_tool
    def get_sales_by_status(sale_status: str = "confirmed") -> str:
        """
        Get sales filtered by their status.

        Args:
            sale_status: One of "draft", "confirmed", or "cancelled". Default "confirmed".

        Returns:
            Count and revenue summary for sales with that status.
        """
        from django.db.models import Sum, Count
        from sales.models import Sale

        sale_status = sale_status.lower().strip()
        valid = {"draft", "confirmed", "cancelled"}
        if sale_status not in valid:
            return f"Invalid status '{sale_status}'. Choose from: draft, confirmed, cancelled."

        agg = Sale.objects.filter(
            project_id=project_id,
            status=sale_status,
        ).aggregate(count=Count("id"), total=Sum("total_amount"))

        count   = agg["count"] or 0
        revenue = agg["total"] or 0
        return (
            f"Status '{sale_status}': {count} sales | Total amount: {revenue:.2f}"
            if count else f"No {sale_status} sales found."
        )

    # ── 4. Sales by customer name ──────────────────────────────────────────────

    @function_tool
    def get_sales_by_customer(customer_name: str) -> str:
        """
        Get all confirmed sales for a specific customer (partial name search).

        Args:
            customer_name: Customer's name or part of it (case-insensitive).

        Returns:
            List of matching sales with dates and amounts.
        """
        from django.db.models import Sum
        from sales.models import Sale, SaleStatus

        sales = Sale.objects.filter(
            project_id            = project_id,
            status                = SaleStatus.CONFIRMED,
            customer_name__icontains = customer_name,
        ).order_by("-confirmed_at")

        if not sales.exists():
            return f"No confirmed sales found for customer matching '{customer_name}'."

        lines = [f"Sales for customer matching '{customer_name}':"]
        for s in sales:
            date_str = s.confirmed_at.strftime("%Y-%m-%d") if s.confirmed_at else "?"
            lines.append(f"  • {date_str} | {s.customer_name} | {s.total_amount:.2f}")

        total = sales.aggregate(t=Sum("total_amount"))["t"] or 0
        lines.append(f"\nTotal: {sales.count()} sales | Revenue: {total:.2f}")
        return "\n".join(lines)

    # ── 5. Sales created by a specific user role ───────────────────────────────

    @function_tool
    def get_sales_by_creator_role(role: str) -> str:
        """
        Get confirmed sales created by users with a specific role.

        Args:
            role: User role — "admin", "manager", or "staff".

        Returns:
            List of sales grouped by creator with totals.
        """
        from django.db.models import Sum, Count
        from sales.models import Sale, SaleStatus

        role = role.lower().strip()
        if role not in {"admin", "manager", "staff"}:
            return "Invalid role. Use 'admin', 'manager', or 'staff'."

        qs = Sale.objects.filter(
            project_id          = project_id,
            status              = SaleStatus.CONFIRMED,
            created_by__role    = role,
        ).select_related("created_by")

        if not qs.exists():
            return f"No confirmed sales created by {role} users."

        # Group by creator
        by_user: dict = {}
        for s in qs:
            email = s.created_by.email if s.created_by else "unknown"
            if email not in by_user:
                by_user[email] = {"count": 0, "total": 0}
            by_user[email]["count"] += 1
            by_user[email]["total"] += float(s.total_amount or 0)

        lines = [f"Confirmed sales created by role '{role}':"]
        for email, stats in sorted(by_user.items()):
            lines.append(f"  • {email}: {stats['count']} sales | revenue = {stats['total']:.2f}")
        return "\n".join(lines)

    # ── 6. All products (with optional inactive) ───────────────────────────────

    @function_tool
    def get_products_data(include_inactive: bool = False) -> str:
        """
        Get the product catalogue for the project.

        Args:
            include_inactive: If True, also show inactive/archived products.

        Returns:
            Full product list with SKU, category, price, cost, and status.
        """
        from products.models import Product

        qs = Product.objects.filter(project_id=project_id)
        if not include_inactive:
            qs = qs.filter(is_active=True)
        qs = qs.select_related("created_by").order_by("name")

        if not qs.exists():
            return "No products found for this project."

        lines = [f"Products ({'all' if include_inactive else 'active only'}):"]
        for p in qs:
            cost    = f"{p.cost_price:.2f}" if p.cost_price else "N/A"
            sku     = p.sku      or "no-SKU"
            cat     = p.category or "uncategorised"
            creator = p.created_by.email if p.created_by else "N/A"
            role    = p.created_by.role  if p.created_by else "N/A"
            active  = "✓ active" if p.is_active else "✗ inactive"
            lines.append(
                f"  • {p.name} | SKU: {sku} | Cat: {cat} | "
                f"Price: {p.price:.2f} | Cost: {cost} | "
                f"Unit: {p.unit} | Created by: {creator} ({role}) | {active}"
            )
        return "\n".join(lines)

    # ── 7. Products filtered by creator role ───────────────────────────────────

    @function_tool
    def get_products_by_creator_role(role: str) -> str:
        """
        Get products created by users with a specific role.

        Args:
            role: "admin", "manager", or "staff".

        Returns:
            List of products with creator email and role.
        """
        from products.models import Product

        role = role.lower().strip()
        if role not in {"admin", "manager", "staff"}:
            return "Invalid role. Use 'admin', 'manager', or 'staff'."

        qs = Product.objects.filter(
            project_id       = project_id,
            created_by__role = role,
        ).select_related("created_by").order_by("name")

        if not qs.exists():
            return f"No products created by users with role '{role}'."

        lines = [f"Products created by role '{role}':"]
        for p in qs:
            creator = p.created_by.email if p.created_by else "N/A"
            active  = "active" if p.is_active else "inactive"
            lines.append(
                f"  • {p.name} | SKU: {p.sku or 'no-SKU'} | "
                f"Price: {p.price:.2f} | {active} | Creator: {creator}"
            )
        return "\n".join(lines)

    # ── 8. Products by category ────────────────────────────────────────────────

    @function_tool
    def get_products_by_category(category: str = "") -> str:
        """
        Get products filtered by category name (partial match, case-insensitive).
        If category is empty, list all unique categories.

        Args:
            category: Category name or partial name. Leave empty to list categories.

        Returns:
            Matching products or list of available categories.
        """
        from products.models import Product

        if not category.strip():
            cats = (
                Product.objects.filter(project_id=project_id, is_active=True)
                .values_list("category", flat=True)
                .distinct()
                .order_by("category")
            )
            cat_list = [c for c in cats if c]
            return "Available categories: " + (", ".join(cat_list) if cat_list else "none")

        qs = Product.objects.filter(
            project_id           = project_id,
            is_active            = True,
            category__icontains  = category,
        ).order_by("name")

        if not qs.exists():
            return f"No active products found in category matching '{category}'."

        lines = [f"Products in category matching '{category}':"]
        for p in qs:
            lines.append(f"  • {p.name} | Price: {p.price:.2f} | SKU: {p.sku or 'no-SKU'}")
        return "\n".join(lines)

    # ── 9. Top-selling products by revenue ────────────────────────────────────

    @function_tool
    def get_top_selling_products(limit: int = 5) -> str:
        """
        Get the top selling products by total revenue from confirmed sales.

        Args:
            limit: Number of top products to return. Default 5, max 20.

        Returns:
            Ranked list of products with units sold and revenue.
        """
        from django.db.models import Sum, F
        from sales.models import SaleItem, SaleStatus

        limit = max(1, min(int(limit), 20))

        results = (
            SaleItem.objects
            .filter(
                sale__project_id=project_id,
                sale__status    =SaleStatus.CONFIRMED,
            )
            .values("product__name")
            .annotate(
                total_revenue=Sum("total_price"),
                total_qty    =Sum("quantity"),
            )
            .order_by("-total_revenue")[:limit]
        )

        if not results:
            return "No sales data available to determine top-selling products."

        lines = [f"Top {limit} Products by Revenue (confirmed sales):"]
        for i, r in enumerate(results, 1):
            lines.append(
                f"  {i}. {r['product__name']} | "
                f"Units sold: {r['total_qty']} | "
                f"Revenue: {r['total_revenue']:.2f}"
            )
        return "\n".join(lines)

    # ── 10. Current inventory snapshot ────────────────────────────────────────

    @function_tool
    def get_inventory_data() -> str:
        """
        Get the current stock levels for all products in the project.

        Returns:
            Per-product stock quantity, low-stock threshold, location, and alert flags.
        """
        from inventory.models import Inventory

        records = (
            Inventory.objects
            .select_related("product")
            .filter(project_id=project_id)
            .order_by("product__name")
        )

        if not records.exists():
            return "No inventory records found for this project."

        lines = ["Current Inventory Snapshot:"]
        for inv in records:
            alert  = ""
            if inv.is_out_of_stock:
                alert = " ⚠ OUT OF STOCK"
            elif inv.is_low_stock:
                alert = " ⚠ LOW STOCK"
            loc = f" | Location: {inv.location}" if inv.location else ""
            lines.append(
                f"  • {inv.product.name}: qty={inv.quantity} "
                f"(low-stock threshold: {inv.low_stock_threshold}){loc}{alert}"
            )
        return "\n".join(lines)

    # ── 11. Low stock / out of stock products ─────────────────────────────────

    @function_tool
    def get_low_stock_products() -> str:
        """
        Get all products that are low on stock or completely out of stock.

        Returns:
            List of at-risk products with current quantity and threshold.
        """
        from inventory.models import Inventory
        from django.db.models import F

        records = (
            Inventory.objects
            .select_related("product")
            .filter(project_id=project_id, quantity__lte=F("low_stock_threshold"))
            .order_by("quantity")
        )

        if not records.exists():
            return "All products are well-stocked. No low-stock or out-of-stock items."

        lines = ["⚠ Low / Out-of-Stock Products:"]
        for inv in records:
            status = "OUT OF STOCK" if inv.quantity == 0 else "LOW STOCK"
            lines.append(
                f"  • {inv.product.name}: qty={inv.quantity} | "
                f"threshold={inv.low_stock_threshold} | [{status}]"
            )
        return "\n".join(lines)

    # ── 12. Stock movement history ────────────────────────────────────────────

    @function_tool
    def get_stock_movements(product_name: str = "", movement_type: str = "", limit: int = 20) -> str:
        """
        Get stock movement history (stock-in, stock-out, adjustments).

        Args:
            product_name:  Filter by product name (partial, case-insensitive). Empty = all.
            movement_type: Filter by type — "stock_in", "stock_out", or "adjustment". Empty = all.
            limit:         Maximum rows to return. Default 20, max 100.

        Returns:
            Chronological list of stock movements with quantities and notes.
        """
        from inventory.models import StockMovement

        limit = max(1, min(int(limit), 100))
        qs = StockMovement.objects.select_related(
            "inventory__product", "performed_by"
        ).filter(inventory__project_id=project_id)

        if product_name.strip():
            qs = qs.filter(inventory__product__name__icontains=product_name)
        if movement_type.strip():
            qs = qs.filter(movement_type=movement_type.lower())

        qs = qs.order_by("-created_at")[:limit]

        if not qs:
            return "No stock movements found matching your criteria."

        lines = [f"Stock Movements (last {limit}):"]
        for m in qs:
            date_str = m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else "?"
            product  = m.inventory.product.name
            by       = m.performed_by.email if m.performed_by else "system"
            lines.append(
                f"  • {date_str} | {product} | {m.movement_type} | "
                f"qty: {m.quantity} ({m.quantity_before}→{m.quantity_after}) | "
                f"by: {by} | note: {m.note or '-'}"
            )
        return "\n".join(lines)

    # ── 13. Revenue & business summary ────────────────────────────────────────

    @function_tool
    def get_revenue_summary() -> str:
        """
        Get an overall business performance summary including total revenue,
        average order value, total products, and total stock value.

        Returns:
            High-level KPI summary for the project.
        """
        from django.db.models import Sum, Count, Avg
        from sales.models import Sale, SaleStatus
        from products.models import Product
        from inventory.models import Inventory

        # Sales KPIs
        sales_agg = Sale.objects.filter(
            project_id=project_id,
            status    =SaleStatus.CONFIRMED,
        ).aggregate(
            total_revenue=Sum("total_amount"),
            sale_count   =Count("id"),
            avg_order    =Avg("total_amount"),
        )

        total_rev  = sales_agg["total_revenue"] or 0
        sale_count = sales_agg["sale_count"]    or 0
        avg_order  = sales_agg["avg_order"]     or 0

        # Product KPIs
        prod_count    = Product.objects.filter(project_id=project_id, is_active=True).count()
        inactive_count= Product.objects.filter(project_id=project_id, is_active=False).count()

        # Inventory value (qty × cost_price)
        inv_records = Inventory.objects.select_related("product").filter(project_id=project_id)
        stock_value = sum(
            inv.quantity * float(inv.product.cost_price or inv.product.price)
            for inv in inv_records
        )

        return (
            f"Business Summary:\n"
            f"  Confirmed Sales : {sale_count}\n"
            f"  Total Revenue   : {total_rev:.2f}\n"
            f"  Avg Order Value : {avg_order:.2f}\n"
            f"  Active Products : {prod_count}\n"
            f"  Inactive Products: {inactive_count}\n"
            f"  Est. Stock Value: {stock_value:.2f}"
        )

    # ── Return all tools ──────────────────────────────────────────────────────
    return [
        get_sales_data,
        get_sales_by_date_range,
        get_sales_by_status,
        get_sales_by_customer,
        get_sales_by_creator_role,
        get_products_data,
        get_products_by_creator_role,
        get_products_by_category,
        get_top_selling_products,
        get_inventory_data,
        get_low_stock_products,
        get_stock_movements,
        get_revenue_summary,
    ]
