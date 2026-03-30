import { useState } from 'react';
import { updateSale } from '../../../api/sales';

const TabCustomerInfo = ({ sale, projectId, onUpdate, onClose }) => {
    const [formData, setFormData] = useState({
        customer_name: sale.customer_name || '',
        customer_phone: sale.customer_phone || '',
        note: sale.note || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const updates = {};
        if (formData.customer_name !== (sale.customer_name || '')) updates.customer_name = formData.customer_name;
        if (formData.customer_phone !== (sale.customer_phone || '')) updates.customer_phone = formData.customer_phone;
        if (formData.note !== (sale.note || '')) updates.note = formData.note;

        if (Object.keys(updates).length === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            const response = await updateSale(projectId, sale.id, updates);
            onUpdate(response.data);
            setSuccess('Customer info updated!');
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                </label>
                <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
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
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                </label>
                <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-green-600 text-sm">{success}</p>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
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
    );
};

export default TabCustomerInfo;