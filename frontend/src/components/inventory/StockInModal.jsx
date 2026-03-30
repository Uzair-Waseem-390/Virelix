import { useState } from 'react';
import Modal from '../Modal';

const StockInModal = ({ isOpen, onClose, inventory, onSubmit, isLoading }) => {
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            setError('Quantity must be at least 1');
            return;
        }

        onSubmit({ quantity: qty, note });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Stock In" size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">Product:</p>
                    <p className="font-medium text-gray-900">{inventory?.product_name}</p>
                    <p className="text-sm text-gray-500 mt-1">Current Stock: {inventory?.quantity} units</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity to Add *
                    </label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        min="1"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note (optional)
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. PO-123, supplier delivery"
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
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Adding...' : 'Add Stock'}
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

export default StockInModal;