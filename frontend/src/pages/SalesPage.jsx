import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getSales, getSalesSummary, getSale, createSale, confirmSale, cancelSale, deleteSale, updateSale, addSaleItem } from '../api/sales';
import { useDebounce } from '../hooks/useDebounce';
import SalesSummaryBar from '../components/sales/SalesSummaryBar';
import SalesTable from '../components/sales/SalesTable';
import SaleDetailPanel from '../components/sales/SaleDetailPanel';
import CreateSaleModal from '../components/sales/CreateSaleModal';
import EditSaleModal from '../components/sales/EditSaleModal';
import ConfirmSaleModal from '../components/sales/ConfirmSaleModal';
import CancelSaleModal from '../components/sales/CancelSaleModal';
import DeleteSaleModal from '../components/sales/DeleteSaleModal';
import Pagination from '../components/common/Pagination';

const SalesPage = () => {
    // Use the correct param name from the route
    const { project_pk } = useParams();
    const projectId = project_pk; // Alias for clarity
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({ total_revenue: 0, total_confirmed_sales: 0, draft_sales: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedSale, setSelectedSale] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 400);

    const handleRowClick = async (sale) => {
        if (!projectId) return;

        try {
            // Fetch full sale details including items
            const response = await getSale(projectId, sale.id);
            console.log('Full sale details:', response.data);
            setSelectedSale(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to fetch sale details:', err);
            // Fallback to the list data if fetch fails
            setSelectedSale(sale);
            return sale;
        }
    };

    const fetchData = useCallback(async () => {
        if (!projectId) {
            console.error('No projectId available');
            return;
        }

        setLoading(true);
        try {
            const params = { page_number: currentPage };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (debouncedSearch) params.search = debouncedSearch;

            const [salesResponse, summaryResponse] = await Promise.all([
                getSales(projectId, params),
                getSalesSummary(projectId)
            ]);

            if (salesResponse.data?.results !== undefined) {
                setSales(salesResponse.data.results);
                setPagination({
                    count:       salesResponse.data.count,
                    page_number: salesResponse.data.page_number,
                    page_size:   salesResponse.data.page_size,
                    total_pages: salesResponse.data.total_pages,
                });
            } else {
                setSales(salesResponse.data);
                setPagination(null);
            }
            setSummary(summaryResponse.data);
        } catch (err) {
            console.error('Failed to fetch sales:', err);
            if (err.response?.status === 403 && err.response?.data?.detail?.includes('module is not enabled')) {
                navigate(`/dashboard/projects/${projectId}`);
            }
        } finally {
            setLoading(false);
        }
    }, [projectId, statusFilter, debouncedSearch, navigate, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [fetchData, projectId]);

    const handleCreateSale = async (data) => {
        if (!projectId) return { success: false };

        console.log('Creating sale with data:', data); // Debug log
        setIsSubmitting(true);
        try {
            const { items, ...saleHeader } = data;

            // 1. Create the sale header
            const response = await createSale(projectId, saleHeader);
            console.log('Create sale response:', response.data); // Debug log
            const newSale = response.data;

            // 2. Add all items to the sale
            if (items && items.length > 0) {
                const addItemsPromises = items.map(item =>
                    addSaleItem(projectId, newSale.id, item)
                );
                await Promise.all(addItemsPromises);
            }

            // 3. Fetch the full sale details to ensure we have items
            const fullSaleResponse = await getSale(projectId, newSale.id);
            console.log('Full sale details:', fullSaleResponse.data); // Debug log

            setSales(prev => [fullSaleResponse.data, ...prev]);
            setShowCreateModal(false);
            await fetchData(); // Refresh summary
            return { success: true };
        } catch (err) {
            console.error('Failed to create sale:', err);
            console.error('Error response:', err.response?.data);
            alert(err.response?.data?.detail || 'Failed to create sale');
            return { success: false };
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSale = async (updatedSale) => {
        setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
        if (selectedSale?.id === updatedSale.id) {
            setSelectedSale(updatedSale);
        }
        fetchData(); // Refresh summary
    };

    const handleConfirmSale = async () => {
        if (!selectedSale || !projectId) return;

        setIsSubmitting(true);
        try {
            const response = await confirmSale(projectId, selectedSale.id);
            setSales(prev => prev.map(s => s.id === selectedSale.id ? response.data.sale : s));
            setShowConfirmModal(false);
            setSelectedSale(null);
            fetchData(); // Refresh summary
        } catch (err) {
            console.error('Failed to confirm sale:', err);
            alert(err.response?.data?.detail || 'Failed to confirm sale');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelSale = async () => {
        if (!selectedSale || !projectId) return;

        setIsSubmitting(true);
        try {
            const response = await cancelSale(projectId, selectedSale.id);
            setSales(prev => prev.map(s => s.id === selectedSale.id ? response.data.sale : s));
            setShowCancelModal(false);
            setSelectedSale(null);
            fetchData(); // Refresh summary
        } catch (err) {
            console.error('Failed to cancel sale:', err);
            alert(err.response?.data?.detail || 'Failed to cancel sale');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSale = async () => {
        if (!selectedSale || !projectId) return;

        setIsSubmitting(true);
        try {
            await deleteSale(projectId, selectedSale.id);
            setSales(prev => prev.filter(s => s.id !== selectedSale.id));
            setShowDeleteModal(false);
            setSelectedSale(null);
            fetchData(); // Refresh summary
        } catch (err) {
            console.error('Failed to delete sale:', err);
            alert(err.response?.data?.detail || 'Failed to delete sale');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEscapeKey = useCallback((e) => {
        if (e.key === 'Escape') {
            if (selectedSale) setSelectedSale(null);
            if (showCreateModal) setShowCreateModal(false);
            if (showEditModal) setShowEditModal(false);
            if (showConfirmModal) setShowConfirmModal(false);
            if (showCancelModal) setShowCancelModal(false);
            if (showDeleteModal) setShowDeleteModal(false);
        }
    }, [selectedSale, showCreateModal, showEditModal, showConfirmModal, showCancelModal, showDeleteModal]);

    useEffect(() => {
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [handleEscapeKey]);

    const statusTabs = [
        { id: 'all', label: 'All' },
        { id: 'draft', label: 'Draft' },
        { id: 'confirmed', label: 'Confirmed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

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
                        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
                        <div className="h-10 bg-gray-200 rounded w-64 mb-6"></div>
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Summary Bar */}
                <SalesSummaryBar summary={summary} onFilterClick={setStatusFilter} />

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
                        <p className="text-gray-600 mt-1">Manage your sales transactions</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        + New Sale
                    </button>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">Total:</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                {pagination ? pagination.count : sales.length} sales
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by customer or note..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                {statusTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setStatusFilter(tab.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === tab.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Table */}
                <SalesTable
                    sales={sales}
                    role={user?.role}
                    onRowClick={handleRowClick}
                    onConfirm={async (sale) => {
                        await handleRowClick(sale);
                        setShowConfirmModal(true);
                    }}
                    onCancel={async (sale) => {
                        await handleRowClick(sale);
                        setShowCancelModal(true);
                    }}
                    onDelete={async (sale) => {
                        await handleRowClick(sale);
                        setShowDeleteModal(true);
                    }}
                />

                {/* Pagination */}
                <Pagination
                    pagination={pagination}
                    onPageChange={(page) => setCurrentPage(page)}
                />
            </div>

            {/* Modals */}
            {selectedSale && (
                <>
                    <SaleDetailPanel
                        sale={selectedSale}
                        role={user?.role}
                        onClose={() => setSelectedSale(null)}
                        onEdit={() => setShowEditModal(true)}
                        onConfirm={() => setShowConfirmModal(true)}
                        onCancel={() => setShowCancelModal(true)}
                        onDelete={() => setShowDeleteModal(true)}
                    />

                    <ConfirmSaleModal
                        isOpen={showConfirmModal}
                        onClose={() => setShowConfirmModal(false)}
                        sale={selectedSale}
                        onConfirm={handleConfirmSale}
                        isLoading={isSubmitting}
                    />

                    <CancelSaleModal
                        isOpen={showCancelModal}
                        onClose={() => setShowCancelModal(false)}
                        sale={selectedSale}
                        onConfirm={handleCancelSale}
                        isLoading={isSubmitting}
                    />

                    <DeleteSaleModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        sale={selectedSale}
                        onConfirm={handleDeleteSale}
                        isLoading={isSubmitting}
                    />
                </>
            )}

            <CreateSaleModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                projectId={projectId}
                onSubmit={handleCreateSale}
                isLoading={isSubmitting}
            />

            {selectedSale && (
                <EditSaleModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    saleId={selectedSale.id}
                    projectId={projectId}
                    onUpdate={handleUpdateSale}
                />
            )}
        </div>
    );
};

export default SalesPage;