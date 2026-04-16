"""
data_entry/tasks.py
────────────────────
Celery task that generates fake historical ERP data for a project.

Design contract:
  - Accepts ONLY history_id — all parameters are fetched from DataEntryHistory.
  - Uses auto_timestamp=False + explicit created_at on every model so the
    data appears historically accurate (not all created "today").
  - Wraps everything in a single transaction.atomic() so a failure mid-way
    rolls back cleanly and marks the history row as FAILED.
  - Inventory stock is seeded large enough to never go negative during
    the generation loop, preventing stock-out errors.
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal

from celery import shared_task
from django.db import transaction
from django.utils import timezone
from faker import Faker

from data_entry.models import DataEntryHistory, DataEntryStatus
from accounts.models import User
from projects.models import Project
from products.models import Product
from inventory.models import Inventory, StockMovement, MovementType
from sales.models import Sale, SaleItem, SaleStatus

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def generate_fake_data(self, history_id: int):
    """
    Generate fake Products, Inventory, and Sales for the project/user
    stored inside DataEntryHistory(id=history_id).

    Dispatched as: generate_fake_data.delay(history_id)
    """
    # ── 1. Load history ───────────────────────────────────────────────────────
    try:
        history = DataEntryHistory.objects.select_related("project", "user").get(id=history_id)
    except DataEntryHistory.DoesNotExist:
        logger.error("DataEntryHistory #%s not found — task aborted.", history_id)
        return

    try:
        # ── 2. Extract parameters ─────────────────────────────────────────────
        params         = history.parameters
        start_date_str = params["start_date"]           # "YYYY-MM-DD"
        duration_days  = int(params.get("duration_days",   30))
        customers_count= int(params.get("customers_count", 50))
        products_count = int(params.get("products_count",  10))
        orders_per_day = int(params.get("orders_per_day",   5))

        project = history.project
        user    = history.user

        # Parse start_date into an aware datetime at midnight
        start_dt = timezone.make_aware(
            datetime.strptime(start_date_str, "%Y-%m-%d")
        )

        logger.info(
            "generate_fake_data started: history_id=%s project=%s user=%s "
            "start=%s days=%s products=%s orders/day=%s",
            history_id, project.name, user.email,
            start_date_str, duration_days, products_count, orders_per_day,
        )

        # ── 3. Create all data inside ONE atomic transaction ──────────────────
        with transaction.atomic():
            fake = Faker("en_US")

            # ── 3a. Generate customer pool ────────────────────────────────────
            customers = [
                {"name": fake.name(), "phone": fake.phone_number()}
                for _ in range(max(customers_count, 1))
            ]

            # ── 3b. Generate Products + Inventory (initial stock-in) ──────────
            # Calculate a safe initial stock so inventory never runs dry:
            # worst case = every sale uses only 1 product × max qty (5) × all days
            safe_stock = max(duration_days * orders_per_day * 5 * 2, 200)

            created_products: list[Product] = []

            for _ in range(max(products_count, 1)):
                price = Decimal(str(fake.random_int(min=10, max=1000)))
                cost  = (price * Decimal("0.6")).quantize(Decimal("0.01"))

                # Product — manual timestamp
                product = Product.objects.create(
                    project       = project,
                    created_by    = user,
                    name          = fake.catch_phrase(),
                    description   = fake.text(max_nb_chars=100),
                    sku           = fake.ean(length=8),   # NOT .unique to avoid global clash
                    price         = price,
                    cost_price    = cost,
                    unit          = "piece",
                    category      = fake.word().capitalize(),
                    is_active     = True,
                    created_at    = start_dt,
                    auto_timestamp= False,
                )
                created_products.append(product)

                # Inventory record
                inventory = Inventory.objects.create(
                    project           = project,
                    product           = product,
                    quantity          = safe_stock,
                    low_stock_threshold = 10,
                    location          = fake.city(),
                    created_at        = start_dt,
                    auto_timestamp    = False,
                )

                # Initial stock-in movement
                StockMovement.objects.create(
                    inventory       = inventory,
                    performed_by    = user,
                    movement_type   = MovementType.STOCK_IN,
                    quantity        = safe_stock,
                    quantity_before = 0,
                    quantity_after  = safe_stock,
                    note            = "Initial data-entry stock-in",
                    created_at      = start_dt,
                    auto_timestamp  = False,
                )

            # ── 3c. Generate Sales across the date range ──────────────────────
            for day_offset in range(duration_days):
                for order_index in range(orders_per_day):
                    # Spread orders evenly across working hours (8:00 – 19:00)
                    hour   = 8 + (order_index % 12)
                    minute = fake.random_int(0, 59)
                    sale_dt = (
                        start_dt
                        + timedelta(days=day_offset, hours=hour, minutes=minute)
                    )

                    # Pick a customer
                    customer = fake.random_element(elements=customers)

                    # Create Sale header — CONFIRMED with manual timestamps
                    sale = Sale.objects.create(
                        project        = project,
                        created_by     = user,
                        customer_name  = customer["name"],
                        customer_phone = customer["phone"],
                        status         = SaleStatus.CONFIRMED,
                        total_amount   = Decimal("0"),   # updated below
                        note           = "",
                        created_at     = sale_dt,
                        confirmed_at   = sale_dt,
                        auto_timestamp = False,
                    )

                    # Pick 1–min(5, products_count) unique products for this sale
                    max_items = min(5, len(created_products))
                    num_items = fake.random_int(min=1, max=max_items)
                    selected  = fake.random_elements(
                        elements=created_products,
                        length=num_items,
                        unique=True,
                    )

                    sale_total = Decimal("0")

                    for product in selected:
                        qty         = fake.random_int(min=1, max=5)
                        unit_price  = product.price
                        total_price = (unit_price * qty).quantize(Decimal("0.01"))

                        # SaleItem
                        SaleItem.objects.create(
                            sale           = sale,
                            product        = product,
                            quantity       = qty,
                            unit_price     = unit_price,
                            total_price    = total_price,
                            created_at     = sale_dt,
                            auto_timestamp = False,
                        )

                        sale_total += total_price

                        # Decrement inventory
                        inv = Inventory.objects.select_for_update().get(product=product)
                        qty_before  = inv.quantity
                        qty_out     = min(qty, inv.quantity)   # never below 0
                        qty_after   = inv.quantity - qty_out
                        inv.quantity = qty_after
                        # Override auto_timestamp so this update doesn't change created_at
                        inv.auto_timestamp = False
                        inv.save()

                        if qty_out > 0:
                            StockMovement.objects.create(
                                inventory       = inv,
                                performed_by    = user,
                                movement_type   = MovementType.STOCK_OUT,
                                quantity        = qty_out,
                                quantity_before = qty_before,
                                quantity_after  = qty_after,
                                note            = f"Sale #{sale.pk}",
                                created_at      = sale_dt,
                                auto_timestamp  = False,
                            )

                    # Update sale total
                    Sale.objects.filter(pk=sale.pk).update(total_amount=sale_total)

        # ── 4. Mark success ───────────────────────────────────────────────────
        DataEntryHistory.objects.filter(pk=history_id).update(
            status=DataEntryStatus.SUCCESS
        )
        logger.info("generate_fake_data SUCCEEDED: history_id=%s", history_id)

    except Exception as exc:
        logger.exception("generate_fake_data FAILED: history_id=%s", history_id)
        DataEntryHistory.objects.filter(pk=history_id).update(
            status        = DataEntryStatus.FAILED,
            error_message = str(exc),
        )
