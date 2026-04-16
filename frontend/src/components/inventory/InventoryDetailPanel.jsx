import { useState, useEffect } from 'react';
import { formatDate } from '../../utils/form';
import MovementTimeline from './MovementTimeline';
import { getMovements } from '../../api/inventory';

const InventoryDetailPanel = ({
    inventory,
    role,
    onClose,
    onStockIn,
    onStockOut,
    onAdjust,
    onEdit,
    onDelete,
}) => {
    const [activeTab, setActiveTab] = useState('details');
    const [movements, setMovements] = useState([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

    const canManage = role === 'admin' || role === 'manager';

    useEffect(() => {
        // Reset tab when a different inventory item is selected
        setActiveTab('details');
        setMovements([]);
    }, [inventory?.id]);

    useEffect(() => {
        if (activeTab === 'history' && inventory?.id) {
            fetchMovements();
        }
    }, [activeTab, inventory?.id]);

    const fetchMovements = async () => {
        setLoadingMovements(true);
        try {
            const response = await getMovements(inventory.project, inventory.id);
            setMovements(response.data);
        } catch (err) {
            console.error('Failed to fetch movements:', err);
        } finally {
            setLoadingMovements(false);
        }
    };

    if (!inventory) return null;

    const getQuantityColor = (quantity, threshold) => {
        if (quantity === 0) return 'text-red-600';
        if (quantity <= threshold) return 'text-orange-500';
        return 'text-green-600';
    };

    const quantityColor = getQuantityColor(inventory.quantity, inventory.low_stock_threshold);

    const stockStatus = inventory.is_out_of_stock
        ? { label: 'Out of Stock', cls: 'bg-red-100 text-red-800' }
        : inventory.is_low_stock
        ? { label: 'Low Stock', cls: 'bg-orange-100 text-orange-800' }
        : { label: 'In Stock', cls: 'bg-green-100 text-green-800' };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel — full-height flex column */}
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">

                {/* ── Header (fixed) ── */}
                <div className="flex-shrink-0 flex items-start justify-between p-6 border-b border-gray-200">
                    <div className="min-w-0 pr-4">
                        <h2 className="text-xl font-semibold text-gray-900 truncate">
                            {inventory.product_name}
                        </h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stockStatus.cls}`}>
                                {stockStatus.label}
                            </span>
                            {inventory.product_category && (
                                <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    {inventory.product_category}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ── Tabs (fixed) ── */}
                <div className="flex-shrink-0 border-b border-gray-200">
                    <div className="flex px-6">
                        {['details', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                                    activeTab === tab
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'history' ? 'Movement History' : 'Details'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Scrollable content ── */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {/* Stock Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 mb-3">Stock Information</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-600">Current Stock:</span>
                                        <div className="text-right">
                                            <span className={`text-2xl font-mono font-bold ${quantityColor}`}>
                                                {inventory.quantity}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-1">
                                                {inventory.product_unit || 'units'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Low Stock Alert:</span>
                                        <span className="text-gray-900">
                                            below {inventory.low_stock_threshold} units
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Location:</span>
                                        <span className="text-gray-900">
                                            {inventory.location || 'Not set'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 mb-3">Product Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">SKU:</span>
                                        <code className="font-mono text-gray-900">
                                            {inventory.product_sku || '—'}
                                        </code>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Unit:</span>
                                        <span className="text-gray-900">
                                            {inventory.product_unit || 'piece'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Category:</span>
                                        <span className="text-gray-900">
                                            {inventory.product_category || '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 mb-3">Record Info</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Created:</span>
                                        <span className="text-gray-900">{formatDate(inventory.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Last Updated:</span>
                                        <span className="text-gray-900">{formatDate(inventory.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            {loadingMovements ? (
                                <div className="text-center py-8">
                                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-gray-500 mt-2 text-sm">Loading history...</p>
                                </div>
                            ) : (
                                <MovementTimeline movements={movements} />
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer (fixed) ── */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => { onClose(); onStockIn(inventory); }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                        >
                            + Stock In
                        </button>
                        <button
                            onClick={() => { onClose(); onStockOut(inventory); }}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
                        >
                            − Stock Out
                        </button>
                        {canManage && (
                            <button
                                onClick={() => { onClose(); onAdjust(inventory); }}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                            >
                                Adjust
                            </button>
                        )}
                        <button
                            onClick={() => { onClose(); onEdit(inventory); }}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                        >
                            Edit
                        </button>
                        {canManage && (
                            <button
                                onClick={() => { onClose(); onDelete(inventory); }}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default InventoryDetailPanel;
