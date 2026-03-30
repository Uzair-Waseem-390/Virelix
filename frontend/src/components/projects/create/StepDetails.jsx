const StepDetails = ({ formData, onChange, onNext, isValidating }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name && formData.description.length >= 20) {
            onNext();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => onChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Retail Store"
                    maxLength={150}
                    required
                    disabled={isValidating}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {formData.name.length}/150 characters
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your business in detail. Our AI will analyze this and automatically configure which ERP modules your business needs..."
                    minLength={20}
                    required
                    disabled={isValidating}
                />
                <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/20 characters minimum
                </p>
                <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                    💡 Tip: Be specific about your business type, products, inventory needs, and sales process for better AI analysis.
                </p>
            </div>

            <button
                onClick={handleSubmit}
                disabled={!formData.name || formData.description.length < 20 || isValidating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Next: Analyze with AI
            </button>
        </div>
    );
};

export default StepDetails;