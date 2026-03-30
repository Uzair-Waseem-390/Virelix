import { formatCurrency, formatDate, calculateProfit, calculateMargin } from '../../utils/form';

const ProductDetailPanel = ({ product, role, onClose, onEdit, onToggleStatus, onDelete }) => {
    // Don't render if no product is selected
    if (!product) return null;

    const canManage = role === 'admin' || role === 'manager';
    const profit = calculateProfit(product.price, product.cost_price);
    const margin = calculateMargin(product.price, product.cost_price);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {product.category && (
                                <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    {product.category}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    <div className="space-y-4">
                        {/* Pricing */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Pricing</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Price:</span>
                                    <span className="font-mono font-medium text-gray-900">
                                        {product.price ? formatCurrency(product.price) : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cost Price:</span>
                                    <span className="font-mono text-gray-900">
                                        {product.cost_price ? formatCurrency(product.cost_price) : '—'}
                                    </span>
                                </div>
                                {profit !== null && product.price && (
                                    <>
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="text-gray-600">Profit:</span>
                                            <span className={`font-mono font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(profit)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Margin:</span>
                                            <span className={`font-mono font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {margin !== null ? `${margin.toFixed(1)}%` : '—'}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Details</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">SKU:</span>
                                    <code className="font-mono text-gray-900">{product.sku || '—'}</code>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Unit:</span>
                                    <span className="text-gray-900">{product.unit || 'piece'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created by:</span>
                                    <span className="text-gray-900">{product.created_by_email || '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="text-gray-900">{formatDate(product.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Last updated:</span>
                                    <span className="text-gray-900">{formatDate(product.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                onClose();
                                onEdit(product);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Edit
                        </button>

                        {canManage && (
                            <>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onToggleStatus(product);
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${product.is_active
                                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                >
                                    {product.is_active ? 'Deactivate' : 'Activate'}
                                </button>

                                <button
                                    onClick={() => {
                                        onClose();
                                        onDelete(product);
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default ProductDetailPanel;