import { useState } from 'react';
import { addSaleItem, updateSaleItem, removeSaleItem } from '../../../api/sales';
import ProductSearchDropdown from '../ProductSearchDropdown';
import SaleItemsTable from '../SaleItemsTable';

const TabItems = ({ sale, projectId, onUpdate, onClose }) => {
    const [items, setItems] = useState(sale.items || []);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [error, setError] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAddItem = async () => {
        if (!selectedProduct) {
            setError('Please select a product');
            return;
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            setError('Quantity must be at least 1');
            return;
        }

        const price = parseFloat(unitPrice);
        if (isNaN(price) || price < 0) {
            setError('Unit price must be valid');
            return;
        }

        setIsAdding(true);
        try {
            const response = await addSaleItem(projectId, sale.id, {
                product_id: selectedProduct.id,
                quantity: qty,
                unit_price: price
            });
            setItems(prev => [...prev, response.data.item]);
            onUpdate({ ...sale, items: [...items, response.data.item], total_amount: response.data.sale_total });
            setSelectedProduct(null);
            setQuantity('');
            setUnitPrice('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to add item');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdateItem = async (itemId, updates) => {
        setIsUpdating(true);
        try {
            const response = await updateSaleItem(projectId, sale.id, itemId, updates);
            setItems(prev => prev.map(item =>
                item.id === itemId ? response.data.item : item
            ));
            onUpdate({
                ...sale, items: items.map(item =>
                    item.id === itemId ? response.data.item : item
                ), total_amount: response.data.sale_total
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update item');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!confirm('Remove this item from sale?')) return;

        setIsUpdating(true);
        try {
            const response = await removeSaleItem(projectId, sale.id, itemId);
            setItems(prev => prev.filter(item => item.id !== itemId));
            onUpdate({ ...sale, items: items.filter(item => item.id !== itemId), total_amount: response.data.sale_total });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to remove item');
        } finally {
            setIsUpdating(false);
        }
    };

    const excludeProductIds = items.map(item => item.product);

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Item</h3>
                <div className="space-y-3">
                    <ProductSearchDropdown
                        projectId={projectId}
                        excludeProductIds={excludeProductIds}
                        onSelect={setSelectedProduct}
                        placeholder="Search product..."
                    />

                    {selectedProduct && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="1"
                                        step="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit Price
                                    </label>
                                    <input
                                        type="number"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(e.target.value)}
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Defaults to {selectedProduct.price}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddItem}
                                disabled={isAdding}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {isAdding ? 'Adding...' : '+ Add Item'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Items in Sale</h3>
                <SaleItemsTable
                    items={items}
                    editable={true}
                    onUpdateItem={handleUpdateItem}
                    onRemoveItem={handleRemoveItem}
                />
            </div>
        </div>
    );
};

export default TabItems;