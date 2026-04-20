"""
sales/views.py
───────────────
Every view runs THREE checks before any logic executes:
  1. Module enabled  — project.has_sales == True
  2. Membership      — request.user belongs to this project
  3. Role            — admin/manager = full, staff = no delete

URL pattern (all nested under a project):
  /projects/<project_pk>/sales/                           list + create
  /projects/<project_pk>/sales/<pk>/                      detail + update + delete
  /projects/<project_pk>/sales/<pk>/confirm/              confirm draft
  /projects/<project_pk>/sales/<pk>/cancel/               cancel draft or confirmed
  /projects/<project_pk>/sales/<pk>/items/                add item to draft
  /projects/<project_pk>/sales/<pk>/items/<item_pk>/      update + remove item
  /projects/<project_pk>/sales/summary/                   revenue summary

The project is fetched ONCE in _get_context() and reused.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from products.models import Product
from projects.selectors.project_selector import get_project_by_id
from sales.permissions import (
    IsAuthenticated,
    assert_sales_module_enabled,
    assert_project_member,
    assert_can_delete,
    assert_can_write,
)
from sales.selectors.sale_selector import (
    get_sale_by_id,
    get_sale_item_by_id,
    get_sales_for_project,
    get_sales_summary_for_project,
    sale_belongs_to_project,
    sale_item_belongs_to_sale,
    search_sales_for_project,
)
from sales.serializers import (
    AddSaleItemSerializer,
    CreateSaleSerializer,
    SaleItemSerializer,
    SaleListSerializer,
    SaleSerializer,
    SalesSummarySerializer,
    UpdateSaleItemSerializer,
    UpdateSaleSerializer,
)
from sales.services.sale_service import (
    add_item_to_sale,
    cancel_sale,
    confirm_sale,
    create_sale,
    delete_sale,
    remove_item_from_sale,
    update_sale,
    update_sale_item,
)
from backend.paginations import StandardResultsSetPagination

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
        assert_sales_module_enabled(project)
        assert_project_member(request.user, project)
    except PermissionError as exc:
        return None, Response(
            {"detail": str(exc)},
            status=status.HTTP_403_FORBIDDEN,
        )
    return project, None


def _get_sale_in_project(sale_pk, project_pk):
    """Fetch a sale and confirm it belongs to this project."""
    sale = get_sale_by_id(sale_pk)
    if sale is None:
        return None, Response(
            {"detail": "Sale not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not sale_belongs_to_project(sale, project_pk):
        return None, Response(
            {"detail": "Sale does not belong to this project."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return sale, None


def _get_item_in_sale(item_pk, sale_pk):
    """Fetch a sale item and confirm it belongs to this sale."""
    item = get_sale_item_by_id(item_pk)
    if item is None:
        return None, Response(
            {"detail": "Sale item not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not sale_item_belongs_to_sale(item, sale_pk):
        return None, Response(
            {"detail": "Item does not belong to this sale."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return item, None


# ─────────────────────────────────────────────────────────────────────────────
# GET  /projects/<project_pk>/sales/       list
# POST /projects/<project_pk>/sales/       create draft
# ─────────────────────────────────────────────────────────────────────────────

class SaleListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get(self, request, project_pk):
        """
        List sales for the project. All roles can view.

        Query params:
          ?status=draft | confirmed | cancelled   filter by status
          ?search=<text>                          search customer name/phone/note
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        status_filter = request.query_params.get("status", "").strip() or None
        search_query  = request.query_params.get("search", "").strip()

        if search_query:
            sales = search_sales_for_project(project.pk, search_query)
            if status_filter:
                sales = sales.filter(status=status_filter)
        else:
            sales = get_sales_for_project(project.pk, status=status_filter)
        
        paginator = self.pagination_class()
        paginated_sales = paginator.paginate_queryset(sales, request)
        serializer = SaleListSerializer(paginated_sales, many=True)

        return paginator.get_paginated_response(serializer.data)

        # return Response(SaleListSerializer(sales, many=True).data)

    def post(self, request, project_pk):
        """
        Create a new DRAFT sale.
        Admin, manager, and staff can create.
        Items are added separately via POST /sales/<pk>/items/.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateSaleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        sale = create_sale(
            project        = project,
            created_by     = request.user,
            customer_name  = d.get("customer_name", ""),
            customer_phone = d.get("customer_phone", ""),
            note           = d.get("note", ""),
        )
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# GET    /projects/<project_pk>/sales/<pk>/     detail
# PATCH  /projects/<project_pk>/sales/<pk>/     update header (draft only)
# DELETE /projects/<project_pk>/sales/<pk>/     hard delete (draft, admin/manager)
# ─────────────────────────────────────────────────────────────────────────────

class SaleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk, pk):
        """Retrieve a sale with all its items. All roles can view."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        return Response(SaleSerializer(sale).data)

    def patch(self, request, project_pk, pk):
        """
        Update sale header (customer info, note).
        Only allowed on DRAFT sales.
        Admin, manager, and staff can update.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        serializer = UpdateSaleSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            updated = update_sale(
                sale           = sale,
                customer_name  = d.get("customer_name"),
                customer_phone = d.get("customer_phone"),
                note           = d.get("note"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(SaleSerializer(updated).data)

    def delete(self, request, project_pk, pk):
        """
        Hard-delete a DRAFT sale.
        Confirmed/cancelled sales cannot be deleted — they are permanent records.
        Admin and manager only.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        try:
            delete_sale(sale)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"detail": "Sale permanently deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /projects/<project_pk>/sales/<pk>/confirm/
# POST /projects/<project_pk>/sales/<pk>/cancel/
# ─────────────────────────────────────────────────────────────────────────────

class SaleConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """
        Confirm a draft sale.
        Decrements inventory for every item atomically.
        Raises 400 if any product has insufficient stock.
        Admin, manager, and staff can confirm.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        try:
            confirmed = confirm_sale(sale=sale, confirmed_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Sale confirmed. Inventory updated.",
            "sale":   SaleSerializer(confirmed).data,
        })


class SaleCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """
        Cancel a draft or confirmed sale.
        If confirmed, restores inventory for every item.
        Admin and manager only — staff cannot cancel.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)   # same gate: admin/manager only
        except PermissionError as exc:
            return Response(
                {"detail": "Staff users cannot cancel sales."},
                status=status.HTTP_403_FORBIDDEN,
            )

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        try:
            cancelled = cancel_sale(sale=sale, cancelled_by=request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "detail": "Sale cancelled. Inventory restored." if cancelled.confirmed_at else "Sale cancelled.",
            "sale":   SaleSerializer(cancelled).data,
        })


# ─────────────────────────────────────────────────────────────────────────────
# POST   /projects/<project_pk>/sales/<pk>/items/             add item
# PATCH  /projects/<project_pk>/sales/<pk>/items/<item_pk>/   update item
# DELETE /projects/<project_pk>/sales/<pk>/items/<item_pk>/   remove item
# ─────────────────────────────────────────────────────────────────────────────

class SaleItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """
        Add a product to a draft sale.
        A product can appear only once per sale.
        Admin, manager, and staff can add items.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        serializer = AddSaleItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        # Validate product belongs to this project
        try:
            product = Product.objects.get(pk=d["product_id"], project=project)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found in this project."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            item = add_item_to_sale(
                sale       = sale,
                product    = product,
                quantity   = d["quantity"],
                unit_price = d.get("unit_price"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        sale.refresh_from_db()
        return Response({
            "item": SaleItemSerializer(item).data,
            "sale_total": str(sale.total_amount),
        }, status=status.HTTP_201_CREATED)


class SaleItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, project_pk, pk, item_pk):
        """
        Update qty and/or price of a sale item on a draft sale.
        Admin, manager, and staff can update.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        item, err = _get_item_in_sale(item_pk, sale.pk)
        if err:
            return err

        serializer = UpdateSaleItemSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            updated_item = update_sale_item(
                item       = item,
                quantity   = d.get("quantity"),
                unit_price = d.get("unit_price"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        sale.refresh_from_db()
        return Response({
            "item":       SaleItemSerializer(updated_item).data,
            "sale_total": str(sale.total_amount),
        })

    def delete(self, request, project_pk, pk, item_pk):
        """
        Remove a product line from a draft sale.
        Admin, manager, and staff can remove items.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        sale, err = _get_sale_in_project(pk, project.pk)
        if err:
            return err

        item, err = _get_item_in_sale(item_pk, sale.pk)
        if err:
            return err

        try:
            remove_item_from_sale(item)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        sale.refresh_from_db()
        return Response({
            "detail":     "Item removed from sale.",
            "sale_total": str(sale.total_amount),
        })


# ─────────────────────────────────────────────────────────────────────────────
# GET /projects/<project_pk>/sales/summary/
# Revenue summary for confirmed sales. All roles can view.
# ─────────────────────────────────────────────────────────────────────────────

class SalesSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        """
        Returns total confirmed sales count and total revenue.
        All roles can view.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        summary = get_sales_summary_for_project(project.pk)
        return Response(SalesSummarySerializer(summary).data)