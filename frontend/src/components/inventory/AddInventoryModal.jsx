import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { getAllProducts } from '../../api/products';

const AddInventoryModal = ({ isOpen, onClose, projectId, existingInventory, onSubmit, isLoading }) => {
    const [products, setProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [threshold, setThreshold] = useState('10');
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAvailableProducts();
            // Reset form when modal opens
            setSelectedProductId('');
            setQuantity('');
            setThreshold('10');
            setLocation('');
            setError('');
        }
    }, [isOpen, projectId]);

    const fetchAvailableProducts = async () => {
        setLoadingProducts(true);
        try {
            console.log('Fetching products for project:', projectId);
            const response = await getAllProducts(projectId);
            console.log('All products response:', response.data);
            console.log('Existing inventory:', existingInventory);

            const allProducts = response.data;

            // Filter out products that already have inventory records
            const existingProductIds = existingInventory.map(item => item.product);
            console.log('Existing product IDs:', existingProductIds);

            const availableProducts = allProducts.filter(p => !existingProductIds.includes(p.id));

            console.log('Available products:', availableProducts);
            setProducts(availableProducts);

            if (availableProducts.length === 0) {
                console.log('No available products - all products already have inventory');
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
            setError('Failed to load products: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Validate selected product
        if (!selectedProductId) {
            setError('Please select a product');
            return;
        }

        // Validate and parse quantity
        const qty = parseInt(quantity);
        if (isNaN(qty)) {
            setError('Quantity must be a number');
            return;
        }
        if (qty < 0) {
            setError('Quantity cannot be negative');
            return;
        }

        // Validate and parse threshold
        const thr = parseInt(threshold);
        if (isNaN(thr)) {
            setError('Low stock alert must be a number');
            return;
        }
        if (thr < 0) {
            setError('Low stock alert cannot be negative');
            return;
        }

        // Prepare data for backend
        const submitData = {
            product_id: parseInt(selectedProductId),
            quantity: qty,
            low_stock_threshold: thr,
            location: location || null
        };

        console.log('Submitting to backend:', submitData); // Debug log
        onSubmit(submitData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add to Inventory" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Product *
                    </label>
                    {loadingProducts ? (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-sm mt-1">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-yellow-800 text-sm">
                                No products available. All products already have inventory records or no products exist yet.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    // Navigate to products page to create products first
                                    window.location.href = `/dashboard/projects/${projectId}/products`;
                                }}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Create products first →
                            </button>
                        </div>
                    ) : (
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a product...</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} {product.sku ? `(${product.sku})` : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Initial Quantity
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="0"
                            step="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                        />
                        <p className="mt-1 text-xs text-gray-500">Starting stock count</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Low Stock Alert
                        </label>
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            min="0"
                            step="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="10"
                        />
                        <p className="mt-1 text-xs text-gray-500">Alert when below this number</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Shelf A-3, Warehouse 2"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading || products.length === 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Add to Inventory'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddInventoryModal;