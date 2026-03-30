import { formatCurrency, formatDate } from '../../utils/form';

const SalesTable = ({ sales, role, onRowClick, onConfirm, onCancel, onDelete }) => {
    const canManage = role === 'admin' || role === 'manager';

    const getStatusBadge = (status) => {
        switch (status) {
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

    const getRelativeTime = (date) => {
        const diff = new Date() - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    if (sales.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg className="w-32 h-32 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No sales yet</h3>
                <p className="text-gray-500 mb-6">Create your first sale to get started</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sales.map((sale, index) => (
                            <tr
                                key={sale.id}
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${sale.status === 'cancelled' ? 'opacity-70' : ''}`}
                                onClick={() => onRowClick(sale)}
                                style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <code className="text-sm font-mono font-medium text-gray-900">
                                        #{String(sale.id).padStart(3, '0')}
                                    </code>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {sale.customer_name || <span className="text-gray-400 italic">Walk-in Customer</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm text-gray-600">{sale.item_count || (sale.items?.length || 0)} items</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="text-sm font-mono font-medium text-gray-900">
                                        {formatCurrency(sale.total_amount)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(sale.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500" title={new Date(sale.created_at).toLocaleString()}>
                                        {getRelativeTime(sale.created_at)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onRowClick(sale)}
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="View Details"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        {sale.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => onConfirm(sale)}
                                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                    title="Confirm Sale"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                {canManage && (
                                                    <button
                                                        onClick={() => onDelete(sale)}
                                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {(sale.status === 'draft' || sale.status === 'confirmed') && canManage && (
                                            <button
                                                onClick={() => onCancel(sale)}
                                                className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                                                title="Cancel Sale"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesTable;