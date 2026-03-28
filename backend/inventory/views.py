"""
inventory/views.py
───────────────────
Every view runs THREE checks before any logic executes:
  1. Module enabled  — project.has_inventory == True
  2. Membership      — request.user belongs to this project
  3. Role            — admin/manager = full, staff = no delete

URL pattern (all nested under a project):
  /projects/<project_pk>/inventory/
  /projects/<project_pk>/inventory/<pk>/
  /projects/<project_pk>/inventory/<pk>/stock-in/
  /projects/<project_pk>/inventory/<pk>/stock-out/
  /projects/<project_pk>/inventory/<pk>/adjust/
  /projects/<project_pk>/inventory/<pk>/movements/
  /projects/<project_pk>/inventory/movements/        (project-level history)
  /projects/<project_pk>/inventory/low-stock/
  /projects/<project_pk>/inventory/out-of-stock/

The project is fetched ONCE in _get_context() and reused — never twice.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from products.models import Product
from projects.selectors.project_selector import get_project_by_id
from inventory.permissions import (
    IsAuthenticated,
    FULL_ACCESS_ROLES,
    assert_inventory_module_enabled,
    assert_project_member,
    assert_can_delete,
    assert_can_write,
)
from inventory.selectors.inventory_selector import (
    get_inventory_by_id,
    get_inventory_by_product,
    get_inventory_for_project,
    get_low_stock_for_project,
    get_out_of_stock_for_project,
    get_movements_for_inventory,
    get_movements_for_project,
    search_inventory_for_project,
    inventory_belongs_to_project,
)
from inventory.serializers import (
    CreateInventorySerializer,
    InventoryListSerializer,
    InventorySerializer,
    StockAdjustSerializer,
    StockInSerializer,
    StockMovementSerializer,
    StockOutSerializer,
    UpdateInventorySerializer,
)
from inventory.services.inventory_service import (
    add_stock,
    adjust_stock,
    create_inventory,
    delete_inventory,
    remove_stock,
    update_inventory,
)

logger = logging.getLogger(__name__)


# ── Shared context helpers ─────────────────────────────────────────────────────

def _get_context(request, project_pk):
    """
    Fetch project, run module check + membership check.
    Returns (project, error_response). error_response is None on success.
    """
    project = get_project_by_id(project_pk)
    if project is None:
        return None, Response(
            {"detail": "Project not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    try:
        assert_inventory_module_enabled(project)
        assert_project_member(request.user, project)
    except PermissionError as exc:
        return None, Response(
            {"detail": str(exc)},
            status=status.HTTP_403_FORBIDDEN,
        )
    return project, None


def _get_inventory_in_project(inventory_pk, project_pk):
    """
    Fetch an inventory record and confirm it belongs to the given project.
    Returns (inventory, error_response).
    """
    inventory = get_inventory_by_id(inventory_pk)
    if inventory is None:
        return None, Response(
            {"detail": "Inventory record not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not inventory_belongs_to_project(inventory, project_pk):
        return None, Response(
            {"detail": "Inventory record does not belong to this project."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return inventory, None


# ─────────────────────────────────────────────────────────────────────────────
# GET  /projects/<project_pk>/inventory/        list all inventory records
# POST /projects/<project_pk>/inventory/        create inventory for a product
# ─────────────────────────────────────────────────────────────────────────────

class InventoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        """
        List all inventory records for the project.
        All roles can view.

        Query params:
          ?search=<text>   search by product name, SKU, location, category
          ?filter=low      show only low-stock records
          ?filter=out      show only out-of-stock records
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        filter_param = request.query_params.get("filter", "").lower()
        search_query = request.query_params.get("search", "").strip()

        if search_query:
            inventory_qs = search_inventory_for_project(project.pk, search_query)
        elif filter_param == "low":
            inventory_qs = get_low_stock_for_project(project.pk)
        elif filter_param == "out":
            inventory_qs = get_out_of_stock_for_project(project.pk)
        else:
            inventory_qs = get_inventory_for_project(project.pk)

        return Response(InventoryListSerializer(inventory_qs, many=True).data)

    def post(self, request, project_pk):
        """
        Create an inventory record for a product.
        Admin, manager, and staff can create.
        A product can only have ONE inventory record.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateInventorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        # Validate product exists and belongs to this project
        try:
            product = Product.objects.get(pk=d["product_id"], project=project)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found in this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            inventory = create_inventory(
                project             = project,
                product             = product,
                created_by          = request.user,
                quantity            = d["quantity"],
                low_stock_threshold = d["low_stock_threshold"],
                location            = d.get("location", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            InventorySerializer(inventory).data,
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET    /projects/<project_pk>/inventory/<pk>/     detail
# PATCH  /projects/<project_pk>/inventory/<pk>/     update settings
# DELETE /projects/<project_pk>/inventory/<pk>/     hard delete (admin/manager)
# ─────────────────────────────────────────────────────────────────────────────

class InventoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk, pk):
        """Retrieve a single inventory record. All roles can view."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        return Response(InventorySerializer(inventory).data)

    def patch(self, request, project_pk, pk):
        """
        Update inventory metadata: low_stock_threshold and/or location.
        Quantity is changed only via stock movements (stock-in / stock-out / adjust).
        Admin, manager, and staff can update.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        serializer = UpdateInventorySerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            updated = update_inventory(
                inventory           = inventory,
                low_stock_threshold = d.get("low_stock_threshold"),
                location            = d.get("location"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(InventorySerializer(updated).data)

    def delete(self, request, project_pk, pk):
        """
        Hard delete inventory record + all its movements.
        Admin and manager only — staff cannot delete.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        product_name = inventory.product.name
        delete_inventory(inventory)
        return Response(
            {"detail": f"Inventory record for '{product_name}' permanently deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /projects/<project_pk>/inventory/<pk>/stock-in/
# POST /projects/<project_pk>/inventory/<pk>/stock-out/
# POST /projects/<project_pk>/inventory/<pk>/adjust/
#
# All roles can perform movements. Staff cannot delete but CAN move stock.
# Each movement is atomic and appended to the audit log.
# ─────────────────────────────────────────────────────────────────────────────

class StockInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """
        Add stock to an inventory record.
        Increases quantity by the given amount.
        All roles can perform stock-in.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        serializer = StockInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            movement = add_stock(
                inventory    = inventory,
                performed_by = request.user,
                quantity     = d["quantity"],
                note         = d.get("note", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        inventory.refresh_from_db()
        return Response({
            "detail":    f"Added {d['quantity']} units to '{inventory.product.name}'.",
            "movement":  StockMovementSerializer(movement).data,
            "inventory": InventorySerializer(inventory).data,
        }, status=status.HTTP_201_CREATED)


class StockOutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """
        Remove stock from an inventory record.
        Decreases quantity by the given amount. Cannot go below 0.
        All roles can perform stock-out.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        serializer = StockOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            movement = remove_stock(
                inventory    = inventory,
                performed_by = request.user,
                quantity     = d["quantity"],
                note         = d.get("note", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        inventory.refresh_from_db()
        return Response({
            "detail":    f"Removed {d['quantity']} units from '{inventory.product.name}'.",
            "movement":  StockMovementSerializer(movement).data,
            "inventory": InventorySerializer(inventory).data,
        }, status=status.HTTP_201_CREATED)


class StockAdjustView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """
        Manual stock adjustment — set quantity to an exact value.
        Use for stocktake corrections.
        Admin and manager only (authoritative override).
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)   # same gate: admin/manager only
        except PermissionError as exc:
            return Response(
                {"detail": "Staff users cannot perform manual stock adjustments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        serializer = StockAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            movement = adjust_stock(
                inventory    = inventory,
                performed_by = request.user,
                new_quantity = d["new_quantity"],
                note         = d.get("note", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        inventory.refresh_from_db()
        return Response({
            "detail":    f"Adjusted '{inventory.product.name}' to {d['new_quantity']} units.",
            "movement":  StockMovementSerializer(movement).data,
            "inventory": InventorySerializer(inventory).data,
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects/<project_pk>/inventory/<pk>/movements/
#     Movement history for a single inventory record.
#
# GET /projects/<project_pk>/inventory/movements/
#     Movement history across the entire project (all products).
#
# Query param: ?type=stock_in | stock_out | adjustment
# ─────────────────────────────────────────────────────────────────────────────

class InventoryMovementsView(APIView):
    """Movement history for a single inventory record."""
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk, pk):
        project, err = _get_context(request, project_pk)
        if err:
            return err

        inventory, err = _get_inventory_in_project(pk, project.pk)
        if err:
            return err

        movement_type = request.query_params.get("type", "").strip() or None
        movements = get_movements_for_inventory(inventory.pk, movement_type=movement_type)
        return Response(StockMovementSerializer(movements, many=True).data)


class ProjectMovementsView(APIView):
    """Movement history across all products in the project."""
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        project, err = _get_context(request, project_pk)
        if err:
            return err

        movement_type = request.query_params.get("type", "").strip() or None
        movements = get_movements_for_project(project.pk, movement_type=movement_type)
        return Response(StockMovementSerializer(movements, many=True).data)


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects/<project_pk>/inventory/low-stock/
# GET /projects/<project_pk>/inventory/out-of-stock/
# All roles can view these alerts.
# ─────────────────────────────────────────────────────────────────────────────

class LowStockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        """List all inventory records where quantity <= low_stock_threshold."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        records = get_low_stock_for_project(project.pk)
        return Response(InventoryListSerializer(records, many=True).data)


class OutOfStockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        """List all inventory records where quantity == 0."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        records = get_out_of_stock_for_project(project.pk)
        return Response(InventoryListSerializer(records, many=True).data)