import { formatCurrency, formatDate } from '../../utils/form';
import SaleItemsTable from './SaleItemsTable';

const SaleDetailPanel = ({ sale, role, onClose, onEdit, onConfirm, onCancel, onDelete }) => {
    if (!sale) return null;

    console.log('Sale detail panel received:', sale); // Debug log
    console.log('Sale items:', sale.items); // Debug log

    const canManage = role === 'admin' || role === 'manager';
    const isDraft = sale.status === 'draft';
    const isConfirmed = sale.status === 'confirmed';
    const isCancelled = sale.status === 'cancelled';

    const getStatusBadge = () => {
        switch (sale.status) {
            case 'draft':
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Draft</span>;
            case 'confirmed':
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Confirmed</span>;
            case 'cancelled':
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 line-through">Cancelled</span>;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose}></div>

            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform animate-slide-in-right">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Sale #{String(sale.id).padStart(3, '0')}
                        </h2>
                        <div className="mt-2">{getStatusBadge()}</div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Information</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Customer:</span>
                                    <span className="text-gray-900 font-medium">{sale.customer_name || 'Walk-in Customer'}</span>
                                </div>
                                {sale.customer_phone && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="text-gray-900">{sale.customer_phone}</span>
                                    </div>
                                )}
                                {sale.note && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Note:</span>
                                        <span className="text-gray-900">{sale.note}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created by:</span>
                                    <span className="text-gray-900">{sale.created_by_email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="text-gray-900">{formatDate(sale.created_at)}</span>
                                </div>
                                {sale.confirmed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Confirmed:</span>
                                        <span className="text-gray-900">{formatDate(sale.confirmed_at)}</span>
                                    </div>
                                )}
                                {sale.cancelled_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Cancelled:</span>
                                        <span className="text-gray-900">{formatDate(sale.cancelled_at)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Items</h3>
                            {sale.items && sale.items.length > 0 ? (
                                <SaleItemsTable items={sale.items} editable={false} />
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No items in this sale
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
                    <div className="flex flex-wrap gap-2">
                        {isDraft && (
                            <>
                                <button
                                    onClick={onEdit}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Edit Sale
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                                >
                                    Confirm Sale
                                </button>
                                {canManage && (
                                    <>
                                        <button
                                            onClick={onCancel}
                                            className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm"
                                        >
                                            Cancel Sale
                                        </button>
                                        <button
                                            onClick={onDelete}
                                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                        {isConfirmed && canManage && (
                            <button
                                onClick={onCancel}
                                className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm"
                            >
                                Cancel Sale
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SaleDetailPanel;