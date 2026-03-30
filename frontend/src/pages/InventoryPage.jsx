import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getInventory, stockIn, stockOut, adjustStock, updateInventory, deleteInventory, getLowStock, getOutOfStock, createInventory } from '../api/inventory';
import { useDebounce } from '../hooks/useDebounce';
import InventoryTable from '../components/inventory/InventoryTable';
import InventoryDetailPanel from '../components/inventory/InventoryDetailPanel';
import AddInventoryModal from '../components/inventory/AddInventoryModal';
import StockInModal from '../components/inventory/StockInModal';
import StockOutModal from '../components/inventory/StockOutModal';
import AdjustStockModal from '../components/inventory/AdjustStockModal';
import EditInventoryModal from '../components/inventory/EditInventoryModal';
import DeleteInventoryModal from '../components/inventory/DeleteInventoryModal';
import StockAlertBanner from '../components/inventory/StockAlertBanner';

const InventoryPage = () => {
    // Use the correct param name from the route
    const { project_pk } = useParams();
    const projectId = project_pk; // Alias for clarity
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [alertCounts, setAlertCounts] = useState({ low_stock: 0, out_of_stock: 0 });

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [showStockOutModal, setShowStockOutModal] = useState(false);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [loadingStates, setLoadingStates] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 400);

    const fetchAlertCounts = useCallback(async () => {
        if (!projectId) return;

        try {
            const [lowStockRes, outOfStockRes] = await Promise.all([
                getLowStock(projectId),
                getOutOfStock(projectId)
            ]);
            setAlertCounts({
                low_stock: lowStockRes.data.length,
                out_of_stock: outOfStockRes.data.length
            });
        } catch (err) {
            console.error('Failed to fetch alert counts:', err);
        }
    }, [projectId]);

    const fetchInventory = useCallback(async () => {
        if (!projectId) {
            console.error('No projectId available');
            return;
        }

        setLoading(true);
        try {
            const params = {};
            if (filter === 'low') params.filter = 'low';
            if (filter === 'out') params.filter = 'out';
            if (debouncedSearch) params.search = debouncedSearch;

            const response = await getInventory(projectId, params);
            setInventory(response.data);
        } catch (err) {
            console.error('Failed to fetch inventory:', err);
            if (err.response?.status === 403 && err.response?.data?.detail?.includes('module is not enabled')) {
                navigate(`/dashboard/projects/${projectId}`);
            }
        } finally {
            setLoading(false);
        }
    }, [projectId, filter, debouncedSearch, navigate]);

    useEffect(() => {
        if (projectId) {
            fetchInventory();
            fetchAlertCounts();
        }
    }, [fetchInventory, fetchAlertCounts, projectId]);

    const handleStockIn = async (inventoryItem, data) => {
        setIsSubmitting(true);
        setLoadingStates(prev => ({ ...prev, [inventoryItem.id]: true }));

        try {
            const response = await stockIn(projectId, inventoryItem.id, data);
            // Update the specific row with new inventory data
            setInventory(prev => prev.map(item =>
                item.id === inventoryItem.id ? response.data.inventory : item
            ));
            setShowStockInModal(false);
            fetchAlertCounts(); // Refresh alert counts
        } catch (err) {
            console.error('Failed to add stock:', err);
            alert(err.response?.data?.detail || 'Failed to add stock');
        } finally {
            setIsSubmitting(false);
            setLoadingStates(prev => ({ ...prev, [inventoryItem.id]: false }));
        }
    };

    const handleStockOut = async (inventoryItem, data) => {
        setIsSubmitting(true);
        setLoadingStates(prev => ({ ...prev, [inventoryItem.id]: true }));

        try {
            const response = await stockOut(projectId, inventoryItem.id, data);
            setInventory(prev => prev.map(item =>
                item.id === inventoryItem.id ? response.data.inventory : item
            ));
            setShowStockOutModal(false);
            fetchAlertCounts();
        } catch (err) {
            console.error('Failed to remove stock:', err);
            alert(err.response?.data?.detail || 'Failed to remove stock');
        } finally {
            setIsSubmitting(false);
            setLoadingStates(prev => ({ ...prev, [inventoryItem.id]: false }));
        }
    };

    const handleAdjustStock = async (inventoryItem, data) => {
        setIsSubmitting(true);
        setLoadingStates(prev => ({ ...prev, [inventoryItem.id]: true }));

        try {
            const response = await adjustStock(projectId, inventoryItem.id, data);
            setInventory(prev => prev.map(item =>
                item.id === inventoryItem.id ? response.data.inventory : item
            ));
            setShowAdjustModal(false);
            fetchAlertCounts();
        } catch (err) {
            console.error('Failed to adjust stock:', err);
            alert(err.response?.data?.detail || 'Failed to adjust stock');
        } finally {
            setIsSubmitting(false);
            setLoadingStates(prev => ({ ...prev, [inventoryItem.id]: false }));
        }
    };

    const handleUpdateInventory = async (inventoryItem, data) => {
        setIsSubmitting(true);

        try {
            const response = await updateInventory(projectId, inventoryItem.id, data);
            setInventory(prev => prev.map(item =>
                item.id === inventoryItem.id ? response.data : item
            ));
            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to update inventory:', err);
            alert(err.response?.data?.detail || 'Failed to update inventory');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteInventory = async () => {
        if (!selectedInventory) return;

        setIsSubmitting(true);
        try {
            await deleteInventory(projectId, selectedInventory.id);
            setInventory(prev => prev.filter(item => item.id !== selectedInventory.id));
            setShowDeleteModal(false);
            setSelectedInventory(null);
            fetchAlertCounts();
        } catch (err) {
            console.error('Failed to delete inventory:', err);
            alert(err.response?.data?.detail || 'Failed to delete inventory');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFilterClick = (type) => {
        if (type === 'out_of_stock') {
            setFilter('out');
        } else if (type === 'low_stock') {
            setFilter('low');
        }
    };

    const handleEscapeKey = useCallback((e) => {
        if (e.key === 'Escape') {
            if (selectedInventory) setSelectedInventory(null);
            if (showAddModal) setShowAddModal(false);
            if (showStockInModal) setShowStockInModal(false);
            if (showStockOutModal) setShowStockOutModal(false);
            if (showAdjustModal) setShowAdjustModal(false);
            if (showEditModal) setShowEditModal(false);
            if (showDeleteModal) setShowDeleteModal(false);
        }
    }, [selectedInventory, showAddModal, showStockInModal, showStockOutModal, showAdjustModal, showEditModal, showDeleteModal]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [handleEscapeKey]);

    // Show validation state while checking for projectId
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
                {/* Alert Banners */}
                {alertCounts.out_of_stock > 0 && (
                    <StockAlertBanner
                        type="out_of_stock"
                        count={alertCounts.out_of_stock}
                        onFilterClick={() => handleFilterClick('out_of_stock')}
                    />
                )}
                {alertCounts.low_stock > 0 && (
                    <StockAlertBanner
                        type="low_stock"
                        count={alertCounts.low_stock}
                        onFilterClick={() => handleFilterClick('low_stock')}
                    />
                )}

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
                        <p className="text-gray-600 mt-1">Manage your stock levels</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        + Add to Inventory
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                {inventory.length} items
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by product or SKU..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Items</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
                <InventoryTable
                    inventory={inventory}
                    role={user?.role}
                    onRowClick={setSelectedInventory}
                    onStockIn={(item) => {
                        setSelectedInventory(item);
                        setShowStockInModal(true);
                    }}
                    onStockOut={(item) => {
                        setSelectedInventory(item);
                        setShowStockOutModal(true);
                    }}
                    onAdjust={(item) => {
                        setSelectedInventory(item);
                        setShowAdjustModal(true);
                    }}
                    onHistory={(item) => {
                        // Navigate to movement history page
                        navigate(`/dashboard/projects/${projectId}/inventory/${item.id}/history`);
                    }}
                    onEdit={(item) => {
                        setSelectedInventory(item);
                        setShowEditModal(true);
                    }}
                    onDelete={(item) => {
                        setSelectedInventory(item);
                        setShowDeleteModal(true);
                    }}
                    loadingStates={loadingStates}
                />
            </div>

            {/* Modals */}
            {selectedInventory && (
                <>
                    <InventoryDetailPanel
                        inventory={selectedInventory}
                        role={user?.role}
                        onClose={() => setSelectedInventory(null)}
                        onStockIn={(item) => {
                            setSelectedInventory(item);
                            setShowStockInModal(true);
                        }}
                        onStockOut={(item) => {
                            setSelectedInventory(item);
                            setShowStockOutModal(true);
                        }}
                        onAdjust={(item) => {
                            setSelectedInventory(item);
                            setShowAdjustModal(true);
                        }}
                        onEdit={(item) => {
                            setSelectedInventory(item);
                            setShowEditModal(true);
                        }}
                        onDelete={(item) => {
                            setSelectedInventory(item);
                            setShowDeleteModal(true);
                        }}
                    />

                    <StockInModal
                        isOpen={showStockInModal}
                        onClose={() => {
                            setShowStockInModal(false);
                            setSelectedInventory(null);
                        }}
                        inventory={selectedInventory}
                        onSubmit={(data) => handleStockIn(selectedInventory, data)}
                        isLoading={isSubmitting}
                    />

                    <StockOutModal
                        isOpen={showStockOutModal}
                        onClose={() => {
                            setShowStockOutModal(false);
                            setSelectedInventory(null);
                        }}
                        inventory={selectedInventory}
                        onSubmit={(data) => handleStockOut(selectedInventory, data)}
                        isLoading={isSubmitting}
                    />

                    <AdjustStockModal
                        isOpen={showAdjustModal}
                        onClose={() => {
                            setShowAdjustModal(false);
                            setSelectedInventory(null);
                        }}
                        inventory={selectedInventory}
                        onSubmit={(data) => handleAdjustStock(selectedInventory, data)}
                        isLoading={isSubmitting}
                    />

                    <EditInventoryModal
                        isOpen={showEditModal}
                        onClose={() => {
                            setShowEditModal(false);
                            setSelectedInventory(null);
                        }}
                        inventory={selectedInventory}
                        onSubmit={(data) => handleUpdateInventory(selectedInventory, data)}
                        isLoading={isSubmitting}
                    />

                    <DeleteInventoryModal
                        isOpen={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setSelectedInventory(null);
                        }}
                        inventory={selectedInventory}
                        onConfirm={handleDeleteInventory}
                        isLoading={isSubmitting}
                    />
                </>
            )}

            <AddInventoryModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                }}
                projectId={projectId}
                existingInventory={inventory}
                onSubmit={async (data) => {
                    if (!data.product_id) {
                        console.error('No product_id in data!');
                        alert('Please select a product');
                        return;
                    }

                    setIsSubmitting(true);
                    try {
                        const response = await createInventory(projectId, data);
                        setInventory(prev => [response.data, ...prev]);
                        setShowAddModal(false);
                        fetchAlertCounts();
                    } catch (err) {
                        console.error('Failed to create inventory:', err);
                        let errorMessage = 'Failed to create inventory';
                        if (err.response?.data?.detail) {
                            errorMessage = err.response.data.detail;
                        } else if (err.response?.data) {
                            errorMessage = JSON.stringify(err.response.data);
                        } else if (err.message) {
                            errorMessage = err.message;
                        }
                        alert(errorMessage);
                    } finally {
                        setIsSubmitting(false);
                    }
                }}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default InventoryPage;