import { useState } from 'react';
import Modal from '../Modal';

const EditInventoryModal = ({ isOpen, onClose, inventory, onSubmit, isLoading }) => {
    const [threshold, setThreshold] = useState(inventory?.low_stock_threshold || '');
    const [location, setLocation] = useState(inventory?.location || '');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const updates = {};
        const newThreshold = parseInt(threshold);
        if (!isNaN(newThreshold) && newThreshold !== inventory.low_stock_threshold) {
            if (newThreshold < 0) {
                setError('Threshold cannot be negative');
                return;
            }
            updates.low_stock_threshold = newThreshold;
        }

        if (location !== inventory.location) {
            updates.location = location;
        }

        if (Object.keys(updates).length === 0) {
            onClose();
            return;
        }

        onSubmit(updates);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Inventory Settings" size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Low Stock Alert Threshold *
                    </label>
                    <input
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Alert when stock falls below this number
                    </p>
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
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
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

export default EditInventoryModal;