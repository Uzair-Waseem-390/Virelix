const StepCustomerInfo = ({ formData, onChange, onNext }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                </label>
                <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank for walk-in customer"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                </label>
                <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                </label>
                <textarea
                    name="note"
                    value={formData.note}
                    onChange={onChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reference, remarks..."
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Next: Add Items →
                </button>
            </div>
        </form>
    );
};

export default StepCustomerInfo;