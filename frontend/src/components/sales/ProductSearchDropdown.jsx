import { useState, useEffect, useRef } from 'react';
import { getAllProducts } from '../../api/products';
import { formatCurrency } from '../../utils/form';

const ProductSearchDropdown = ({ projectId, excludeProductIds = [], onSelect, placeholder = "Search product..." }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchProducts();
    }, [projectId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProducts(products.filter(p => !excludeProductIds.includes(p.id)));
        } else {
            const filtered = products.filter(p =>
                !excludeProductIds.includes(p.id) &&
                (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())))
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products, excludeProductIds]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await getAllProducts(projectId);
            setProducts(response.data);
            setFilteredProducts(response.data.filter(p => !excludeProductIds.includes(p.id)));
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (product) => {
        onSelect(product);
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {isOpen && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredProducts.map(product => (
                        <button
                            key={product.id}
                            onClick={() => handleSelect(product)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {product.sku && <span>SKU: {product.sku} • </span>}
                                Price: {formatCurrency(product.price)}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && filteredProducts.length === 0 && !loading && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No products available
                </div>
            )}
        </div>
    );
};

export default ProductSearchDropdown;