import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, activateProduct, deactivateProduct } from '../api/products';
import { useDebounce } from '../hooks/useDebounce';
import ProductsTable from '../components/products/ProductsTable';
import ProductDetailPanel from '../components/products/ProductDetailPanel';
import AddProductModal from '../components/products/AddProductModal';
import EditProductModal from '../components/products/EditProductModal';
import DeleteProductModal from '../components/products/DeleteProductModal';

const ProductsPage = () => {
    // Use the correct param name from the route
    const { project_pk } = useParams();
    const projectId = project_pk; // Alias for clarity
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('active');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loadingStates, setLoadingStates] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 400);

    const fetchProducts = useCallback(async () => {
        if (!projectId) {
            console.error('No projectId available');
            return;
        }

        setLoading(true);
        try {
            const params = { filter };
            if (debouncedSearch) {
                params.search = debouncedSearch;
            }
            const response = await getProducts(projectId, params);
            setProducts(response.data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
            if (err.response?.status === 403 && err.response?.data?.detail?.includes('module is not enabled')) {
                navigate(`/dashboard/projects/${projectId}`);
            }
        } finally {
            setLoading(false);
        }
    }, [projectId, filter, debouncedSearch, navigate]);

    useEffect(() => {
        if (projectId) {
            fetchProducts();
        }
    }, [fetchProducts, projectId]);

    const handleCreateProduct = async (data) => {
        setIsSubmitting(true);
        try {
            const response = await createProduct(projectId, data);
            setProducts(prev => [response.data, ...prev]);
            setShowAddModal(false);
        } catch (err) {
            console.error('Failed to create product:', err);
            alert(err.response?.data?.detail || 'Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProduct = async (productId, data) => {
        setIsSubmitting(true);
        try {
            const response = await updateProduct(projectId, productId, data);
            setProducts(prev => prev.map(p => p.id === productId ? response.data : p));
            setShowEditModal(false);
            if (selectedProduct?.id === productId) {
                setSelectedProduct(response.data);
            }
        } catch (err) {
            console.error('Failed to update product:', err);
            alert(err.response?.data?.detail || 'Failed to update product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (product) => {
        setLoadingStates(prev => ({ ...prev, [product.id]: true }));

        const originalProduct = { ...product };
        const optimisticUpdate = { ...product, is_active: !product.is_active };
        setProducts(prev => prev.map(p => p.id === product.id ? optimisticUpdate : p));

        // Update selected product if it's the one being toggled
        if (selectedProduct?.id === product.id) {
            setSelectedProduct(optimisticUpdate);
        }

        try {
            if (product.is_active) {
                await deactivateProduct(projectId, product.id);
            } else {
                await activateProduct(projectId, product.id);
            }
        } catch (err) {
            // Rollback on error
            setProducts(prev => prev.map(p => p.id === product.id ? originalProduct : p));
            if (selectedProduct?.id === product.id) {
                setSelectedProduct(originalProduct);
            }
            alert(err.response?.data?.detail || 'Failed to update product status');
        } finally {
            setLoadingStates(prev => ({ ...prev, [product.id]: false }));
        }
    };

    const handleDeleteProduct = async () => {
        if (!selectedProduct) return;

        setIsSubmitting(true);
        const productId = selectedProduct.id;
        try {
            await deleteProduct(projectId, productId);
            setProducts(prev => prev.filter(p => p.id !== productId));
            setShowDeleteModal(false);
            setSelectedProduct(null);
        } catch (err) {
            console.error('Failed to delete product:', err);
            alert(err.response?.data?.detail || 'Failed to delete product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRowClick = async (product) => {
        // Set list item immediately so panel opens instantly
        setSelectedProduct(product);
        // Then fetch full detail to get created_by_email and all fields
        try {
            const response = await getProduct(projectId, product.id);
            setSelectedProduct(response.data);
        } catch (err) {
            console.error('Failed to fetch product detail:', err);
            // Keep the list item data — panel still shows partial info
        }
    };

    const handleEditClick = (product) => {
        setSelectedProduct(product);
        setShowEditModal(true);
    };

    const handleDeleteClick = (product) => {
        setSelectedProduct(product);
        setShowDeleteModal(true);
    };

    const handleEscapeKey = useCallback((e) => {
        if (e.key === 'Escape') {
            if (selectedProduct) setSelectedProduct(null);
            if (showAddModal) setShowAddModal(false);
            if (showEditModal) setShowEditModal(false);
            if (showDeleteModal) setShowDeleteModal(false);
        }
    }, [selectedProduct, showAddModal, showEditModal, showDeleteModal]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [handleEscapeKey]);

    // Show loading state while checking for projectId
    if (!projectId) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">No project selected. Please go back and select a project.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                            <div className="p-6">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="mb-4">
                                        <div className="h-16 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const canManage = user?.role === 'admin' || user?.role === 'manager';

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                        <p className="text-gray-600 mt-1">Manage your product catalog</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        + Add Product
                    </button>
                </div>

                {/* Products Table */}
                <ProductsTable
                    products={products}
                    role={user?.role}
                    onRowClick={handleRowClick}
                    onEdit={handleEditClick}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDeleteClick}
                    loadingStates={loadingStates}
                />
            </div>

            {/* Modals and Panels - Only render when product exists */}
            {selectedProduct && (
                <ProductDetailPanel
                    product={selectedProduct}
                    role={user?.role}
                    onClose={() => setSelectedProduct(null)}
                    onEdit={(product) => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                    }}
                    onToggleStatus={handleToggleStatus}
                    onDelete={(product) => {
                        setSelectedProduct(product);
                        setShowDeleteModal(true);
                    }}
                />
            )}

            <AddProductModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleCreateProduct}
                isLoading={isSubmitting}
            />

            {selectedProduct && (
                <EditProductModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProduct(null);
                    }}
                    product={selectedProduct}
                    onSubmit={(data) => handleUpdateProduct(selectedProduct.id, data)}
                    isLoading={isSubmitting}
                />
            )}

            {selectedProduct && (
                <DeleteProductModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedProduct(null);
                    }}
                    product={selectedProduct}
                    onConfirm={handleDeleteProduct}
                    isLoading={isSubmitting}
                />
            )}
        </div>
    );
};

export default ProductsPage;