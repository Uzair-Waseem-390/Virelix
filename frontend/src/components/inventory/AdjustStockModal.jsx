import { useState, useEffect } from 'react';
import Modal from '../Modal';

const AdjustStockModal = ({ isOpen, onClose, inventory, onSubmit, isLoading }) => {
    const [newQuantity, setNewQuantity] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [diff, setDiff] = useState(null);

    useEffect(() => {
        if (inventory && newQuantity !== '') {
            const qty = parseInt(newQuantity);
            if (!isNaN(qty)) {
                setDiff(qty - inventory.quantity);
            } else {
                setDiff(null);
            }
        } else {
            setDiff(null);
        }
    }, [newQuantity, inventory]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const qty = parseInt(newQuantity);
        if (isNaN(qty)) {
            setError('New quantity is required');
            return;
        }

        if (qty < 0) {
            setError('Quantity cannot be negative');
            return;
        }

        if (qty === inventory.quantity) {
            setError('No change to apply');
            return;
        }

        onSubmit({ new_quantity: qty, note });
    };

    const getDiffColor = () => {
        if (!diff) return 'text-gray-600';
        if (diff > 0) return 'text-green-600';
        if (diff < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getDiffText = () => {
        if (!diff) return '';
        if (diff > 0) return `+${diff} units`;
        if (diff < 0) return `${diff} units`;
        return 'No change';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adjust Stock" size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">Product:</p>
                    <p className="font-medium text-gray-900">{inventory?.product_name}</p>
                    <p className="text-sm text-gray-500 mt-1">Current Stock: {inventory?.quantity} units</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Quantity *
                    </label>
                    <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    {diff !== null && newQuantity !== '' && (
                        <p className={`mt-1 text-sm font-medium ${getDiffColor()}`}>
                            Change: {getDiffText()}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Set the exact current stock count (e.g., after a stocktake)
                    </p>
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
                        placeholder="e.g. Stocktake correction"
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
                        disabled={isLoading || (newQuantity && parseInt(newQuantity) === inventory?.quantity)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Adjusting...' : 'Adjust Stock'}
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

export default AdjustStockModal;