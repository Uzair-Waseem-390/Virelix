import { useState } from 'react';
import ProductSearchDropdown from '../ProductSearchDropdown';
import SaleItemsTable from '../SaleItemsTable';
import { formatCurrency } from '../../../utils/form';

const StepAddItems = ({ projectId, items, onAddItem, onRemoveItem, onUpdateItem, onBack, onSubmit, isSubmitting }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');
    const [error, setError] = useState('');

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setQuantity('');
        setUnitPrice(product.price);
        setError('');
    };

    const handleAddItem = () => {
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

        onAddItem({
            product_id: selectedProduct.id,
            product_name: selectedProduct.name,
            product_sku: selectedProduct.sku,
            quantity: qty,
            unit_price: price,
            id: Date.now() // temporary ID for UI
        });

        setSelectedProduct(null);
        setQuantity('');
        setUnitPrice('');
        setError('');
    };

    const total = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unit_price)), 0);
    const excludeProductIds = items.map(item => item.product_id);

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add Product</h3>
                <div className="space-y-3">
                    <ProductSearchDropdown
                        projectId={projectId}
                        excludeProductIds={excludeProductIds}
                        onSelect={handleProductSelect}
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
                                        placeholder="1"
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
                                        Defaults to product price. Edit to override.
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                + Add Item
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Items Added</h3>
                <SaleItemsTable
                    items={items}
                    editable={true}
                    onUpdateItem={onUpdateItem}
                    onRemoveItem={onRemoveItem}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={items.length === 0 || isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Creating...' : `Create Sale — ${formatCurrency(total)}`}
                </button>
            </div>
        </div>
    );
};

export default StepAddItems;