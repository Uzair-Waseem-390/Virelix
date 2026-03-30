import { formatCurrency } from '../../utils/form';

const InventoryTable = ({
    inventory,
    role,
    onRowClick,
    onStockIn,
    onStockOut,
    onAdjust,
    onHistory,
    onEdit,
    onDelete,
    loadingStates
}) => {
    const canManage = role === 'admin' || role === 'manager';

    const getQuantityColor = (quantity, threshold) => {
        if (quantity === 0) return 'text-red-600 font-bold';
        if (quantity <= threshold) return 'text-orange-500 font-bold';
        return 'text-green-600';
    };

    const getStatusBadge = (isOutOfStock, isLowStock) => {
        if (isOutOfStock) {
            return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>;
        }
        if (isLowStock) {
            return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Low Stock</span>;
        }
        return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>;
    };

    if (inventory.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg className="w-32 h-32 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No inventory records</h3>
                <p className="text-gray-500 mb-6">Add products to inventory to start tracking stock</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {inventory.map((item, index) => (
                            <tr
                                key={item.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onRowClick(item)}
                                style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                            {item.product_name}
                                        </div>
                                        {item.product_category && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {item.product_category}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <code className="text-sm font-mono text-gray-600">
                                        {item.product_sku || '—'}
                                    </code>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">
                                        {item.location || '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className={`text-lg font-mono font-bold ${getQuantityColor(item.quantity, item.low_stock_threshold)}`}>
                                        {item.quantity}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                        {item.product_unit || 'units'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500">
                                        min. {item.low_stock_threshold}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(item.is_out_of_stock, item.is_low_stock)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onStockIn(item)}
                                            className="p-1 text-green-600 hover:text-green-700 transition-colors rounded hover:bg-green-50"
                                            title="Stock In"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => onStockOut(item)}
                                            className="p-1 text-red-600 hover:text-red-700 transition-colors rounded hover:bg-red-50"
                                            title="Stock Out"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                            </svg>
                                        </button>

                                        {canManage && (
                                            <button
                                                onClick={() => onAdjust(item)}
                                                className="p-1 text-blue-600 hover:text-blue-700 transition-colors rounded hover:bg-blue-50"
                                                title="Adjust Stock"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onHistory(item)}
                                            className="p-1 text-gray-600 hover:text-gray-700 transition-colors rounded hover:bg-gray-50"
                                            title="Movement History"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors rounded hover:bg-blue-50"
                                            title="Edit Settings"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>

                                        {canManage && (
                                            <button
                                                onClick={() => onDelete(item)}
                                                className="p-1 text-red-600 hover:text-red-700 transition-colors rounded hover:bg-red-50"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

export default InventoryTable;