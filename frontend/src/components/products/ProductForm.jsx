import { useState } from 'react';

const ProductForm = ({ initialValues = {}, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        name: initialValues.name || '',
        price: initialValues.price || '',
        cost_price: initialValues.cost_price || '',
        sku: initialValues.sku || '',
        unit: initialValues.unit || 'piece',
        category: initialValues.category || '',
        description: initialValues.description || '',
    });
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Name is required';
                return '';
            case 'price':
                if (!value && value !== 0) return 'Price is required';
                if (value < 0) return 'Price cannot be negative';
                return '';
            case 'cost_price':
                if (value && value < 0) return 'Cost price cannot be negative';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all fields
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Prepare data for submission (convert numbers)
        const submitData = {
            ...formData,
            price: parseFloat(formData.price),
            cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        };

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="Product name"
                />
                {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="0.00"
                    />
                    {errors.price && (
                        <p className="mt-1 text-xs text-red-500">{errors.price}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price
                    </label>
                    <input
                        type="number"
                        name="cost_price"
                        value={formData.cost_price}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cost_price ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="0.00"
                    />
                    {errors.cost_price && (
                        <p className="mt-1 text-xs text-red-500">{errors.cost_price}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        SKU
                    </label>
                    <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SKU-001"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                    </label>
                    <input
                        type="text"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="piece"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                </label>
                <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Electronics, Furniture, etc."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Product description..."
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default ProductForm;