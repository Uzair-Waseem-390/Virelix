import { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/form';

const ProductsTable = ({
    products,
    role,
    onRowClick,
    onEdit,
    onToggleStatus,
    onDelete,
    loadingStates
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('active');

    const canManage = role === 'admin' || role === 'manager';

    const filteredProducts = products.filter(product => {
        // Filter by status
        if (filter === 'active' && !product.is_active) return false;
        if (filter === 'inactive' && product.is_active) return false;

        // Filter by search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return product.name.toLowerCase().includes(searchLower) ||
                (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
                (product.category && product.category.toLowerCase().includes(searchLower));
        }

        return true;
    });

    if (products.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg className="w-32 h-32 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-6">Add your first product to get started</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                            {filteredProducts.length} products
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {canManage && (
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="all">All</option>
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredProducts.map((product, index) => (
                            <tr
                                key={product.id}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onRowClick(product)}
                                style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                        {product.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <code className="text-sm font-mono text-gray-600">
                                        {product.sku || '—'}
                                    </code>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.category && (
                                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                            {product.category}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="text-sm font-mono font-medium text-gray-900">
                                        {formatCurrency(product.price)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-600">{product.unit || 'piece'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {product.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onEdit(product)}
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50"
                                            title="Edit"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>

                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => onToggleStatus(product)}
                                                    disabled={loadingStates[product.id]}
                                                    className={`p-1 transition-colors rounded ${product.is_active
                                                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title={product.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {loadingStates[product.id] ? (
                                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => onDelete(product)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </>
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

export default ProductsTable;