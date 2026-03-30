import { useState } from 'react';
import { formatCurrency } from '../../utils/form';

const SaleItemsTable = ({ items, editable = false, onUpdateItem, onRemoveItem }) => {
    const [editingItem, setEditingItem] = useState(null);
    const [editQuantity, setEditQuantity] = useState('');
    const [editUnitPrice, setEditUnitPrice] = useState('');

    const handleStartEdit = (item) => {
        setEditingItem(item.id);
        setEditQuantity(item.quantity.toString());
        setEditUnitPrice(item.unit_price);
    };

    const handleSaveEdit = (item) => {
        const updates = {};
        const newQuantity = parseInt(editQuantity);
        const newUnitPrice = parseFloat(editUnitPrice);

        if (!isNaN(newQuantity) && newQuantity !== item.quantity) {
            updates.quantity = newQuantity;
        }
        if (!isNaN(newUnitPrice) && newUnitPrice !== parseFloat(item.unit_price)) {
            updates.unit_price = newUnitPrice;
        }

        if (Object.keys(updates).length > 0) {
            onUpdateItem(item.id, updates);
        }
        setEditingItem(null);
    };

    const total = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unit_price)), 0);

    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No items added yet
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Unit Price</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Total</th>
                            {editable && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-20">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                        <div className="text-xs text-gray-500">{item.product_sku || 'No SKU'}</div>
                                    </div>
                                </td>
                                {editable && editingItem === item.id ? (
                                    <>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={editQuantity}
                                                onChange={(e) => setEditQuantity(e.target.value)}
                                                min="1"
                                                className="w-20 px-2 py-1 text-right border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={editUnitPrice}
                                                onChange={(e) => setEditUnitPrice(e.target.value)}
                                                step="0.01"
                                                min="0"
                                                className="w-24 px-2 py-1 text-right border border-gray-300 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {formatCurrency(item.quantity * parseFloat(item.unit_price))}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleSaveEdit(item)}
                                                    className="p-1 text-green-600 hover:text-green-700"
                                                    title="Save"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setEditingItem(null)}
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                    title="Cancel"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {item.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-medium">
                                            {formatCurrency(item.quantity * parseFloat(item.unit_price))}
                                        </td>
                                        {editable && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleStartEdit(item)}
                                                        className="p-1 text-blue-600 hover:text-blue-700"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => onRemoveItem(item.id)}
                                                        className="p-1 text-red-600 hover:text-red-700"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan={editable ? 3 : 3} className="px-4 py-3 text-right font-semibold text-gray-900">
                                Total:
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-lg text-gray-900">
                                {formatCurrency(total)}
                            </td>
                            {editable && <td></td>}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default SaleItemsTable;