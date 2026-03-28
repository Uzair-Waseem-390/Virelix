"""
products/views.py
──────────────────
Every view runs THREE checks before any logic executes:
  1. Module enabled  — project.has_products == True
  2. Membership      — request.user belongs to this project
  3. Role            — does this role allow this operation?

URL pattern: all products endpoints are nested under a project:
  /projects/<project_pk>/products/
  /projects/<project_pk>/products/<pk>/
  /projects/<project_pk>/products/<pk>/deactivate/
  /projects/<project_pk>/products/<pk>/activate/

The project_pk comes from the URL. We fetch the project once in
_get_context() and reuse it throughout the view — never fetch twice.

Query params for GET /projects/<project_pk>/products/:
  ?search=<query>        search name, SKU, category, description
  ?filter=active         (default) only active products
  ?filter=inactive       only deactivated products  (admin/manager only)
  ?filter=all            active + inactive combined  (admin/manager only)
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from projects.selectors.project_selector import get_project_by_id
from products.permissions import (
    IsAuthenticated,
    FULL_ACCESS_ROLES,
    assert_products_module_enabled,
    assert_project_member,
    assert_can_delete,
    assert_can_write,
)
from products.selectors.product_selector import (
    get_product_by_id,
    get_active_products_for_project,
    get_inactive_products_for_project,
    get_all_products_for_project,
    search_products_for_project,
    product_belongs_to_project,
)
from products.serializers import (
    CreateProductSerializer,
    ProductListSerializer,
    ProductSerializer,
    UpdateProductSerializer,
)
from products.services.product_service import (
    create_product,
    update_product,
    delete_product,
    set_product_active,
)

logger = logging.getLogger(__name__)


# ── Shared context helper ─────────────────────────────────────────────────────

def _get_context(request, project_pk):
    """
    Fetch the project, then run module + membership checks.
    Returns (project, error_response).
    error_response is None on success — caller proceeds.
    """
    project = get_project_by_id(project_pk)
    if project is None:
        return None, Response(
            {"detail": "Project not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    try:
        assert_products_module_enabled(project)
        assert_project_member(request.user, project)
    except PermissionError as exc:
        return None, Response(
            {"detail": str(exc)},
            status=status.HTTP_403_FORBIDDEN,
        )
    return project, None


def _get_product_in_project(product_pk, project_pk):
    """
    Fetch a product and confirm it belongs to the given project.
    Returns (product, error_response).
    """
    product = get_product_by_id(product_pk)
    if product is None:
        return None, Response(
            {"detail": "Product not found."},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not product_belongs_to_project(product, project_pk):
        return None, Response(
            {"detail": "Product does not belong to this project."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return product, None


# ─────────────────────────────────────────────────────────────────────────────
# GET  /projects/<project_pk>/products/
# POST /projects/<project_pk>/products/
# ─────────────────────────────────────────────────────────────────────────────

class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk):
        """
        List products in the project.

        Query params:
          ?filter=active     (default) only active products
          ?filter=inactive   only deactivated products  (admin/manager only)
          ?filter=all        both active and inactive   (admin/manager only)
          ?search=<text>     search across name/SKU/category/description
                             (respects the filter param above)

        Staff always sees active products only regardless of filter param.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        filter_param  = request.query_params.get("filter", "active").lower()
        search_query  = request.query_params.get("search", "").strip()
        is_privileged = request.user.role in FULL_ACCESS_ROLES

        # Staff is locked to active-only regardless of what they pass
        if not is_privileged:
            filter_param = "active"

        # ── Resolve queryset based on filter ─────────────────────────────────
        if search_query:
            # Search mode: active_only controls whether inactive are included
            active_only = (filter_param != "all" and filter_param != "inactive")
            products = search_products_for_project(
                project_id  = project.pk,
                query       = search_query,
                active_only = active_only,
            )
            # If filter=inactive, further narrow to is_active=False
            if filter_param == "inactive":
                products = products.filter(is_active=False)
        else:
            # No search — pick the right selector directly
            if filter_param == "inactive":
                products = get_inactive_products_for_project(project.pk)
            elif filter_param == "all":
                products = get_all_products_for_project(project.pk)
            else:
                products = get_active_products_for_project(project.pk)

        return Response(ProductListSerializer(products, many=True).data)

    def post(self, request, project_pk):
        """Create a new product. Admin, manager, and staff can create."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            product = create_product(
                project     = project,
                created_by  = request.user,
                name        = d["name"],
                price       = d["price"],
                description = d.get("description", ""),
                sku         = d.get("sku", ""),
                cost_price  = d.get("cost_price"),
                unit        = d.get("unit", "piece"),
                category    = d.get("category", ""),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# GET    /projects/<project_pk>/products/<pk>/
# PATCH  /projects/<project_pk>/products/<pk>/
# DELETE /projects/<project_pk>/products/<pk>/
# ─────────────────────────────────────────────────────────────────────────────

class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, project_pk, pk):
        """Retrieve a single product. All roles can view."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        product, err = _get_product_in_project(pk, project.pk)
        if err:
            return err

        return Response(ProductSerializer(product).data)

    def patch(self, request, project_pk, pk):
        """Partial update. Admin, manager, and staff can update."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_write(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        product, err = _get_product_in_project(pk, project.pk)
        if err:
            return err

        serializer = UpdateProductSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            updated = update_product(
                product     = product,
                name        = d.get("name"),
                description = d.get("description"),
                sku         = d.get("sku"),
                price       = d.get("price"),
                cost_price  = d.get("cost_price"),
                unit        = d.get("unit"),
                category    = d.get("category"),
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ProductSerializer(updated).data)

    def delete(self, request, project_pk, pk):
        """
        Hard delete. Admin and manager only — staff cannot delete.
        Permanently removes the product. Use /deactivate/ for reversible removal.
        """
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        product, err = _get_product_in_project(pk, project.pk)
        if err:
            return err

        product_name = product.name
        delete_product(product)
        return Response(
            {"detail": f"Product '{product_name}' permanently deleted."},
            status=status.HTTP_204_NO_CONTENT,
        )


# ─────────────────────────────────────────────────────────────────────────────
# POST /projects/<project_pk>/products/<pk>/activate/
# POST /projects/<project_pk>/products/<pk>/deactivate/
# Admin and manager only.
# ─────────────────────────────────────────────────────────────────────────────

class ProductActivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """Restore a deactivated product. Admin/manager only."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        product, err = _get_product_in_project(pk, project.pk)
        if err:
            return err

        updated = set_product_active(product, active=True)
        return Response({
            "detail":  f"Product '{updated.name}' activated.",
            "product": ProductSerializer(updated).data,
        })


class ProductDeactivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, project_pk, pk):
        """Soft-delete a product. Admin/manager only."""
        project, err = _get_context(request, project_pk)
        if err:
            return err

        try:
            assert_can_delete(request.user)
        except PermissionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)

        product, err = _get_product_in_project(pk, project.pk)
        if err:
            return err

        updated = set_product_active(product, active=False)
        return Response({
            "detail":  f"Product '{updated.name}' deactivated.",
            "product": ProductSerializer(updated).data,
        })