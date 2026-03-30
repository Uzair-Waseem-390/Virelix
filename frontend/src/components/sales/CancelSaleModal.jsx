import Modal from '../Modal';

const CancelSaleModal = ({ isOpen, onClose, sale, onConfirm, isLoading }) => {
    if (!sale) return null;

    const isConfirmed = sale.status === 'confirmed';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancel Sale" size="md">
            <div className="space-y-4">
                <div className={`rounded-lg p-4 ${isConfirmed ? 'bg-orange-50 border border-orange-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConfirmed ? 'bg-orange-100' : 'bg-red-100'}`}>
                            <svg className={`w-6 h-6 ${isConfirmed ? 'text-orange-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className={`font-semibold ${isConfirmed ? 'text-orange-800' : 'text-red-800'}`}>
                                Cancel Sale #{String(sale.id).padStart(3, '0')}?
                            </h3>
                            <p className={`text-sm ${isConfirmed ? 'text-orange-600' : 'text-red-600'}`}>
                                Status: {sale.status === 'confirmed' ? 'Confirmed' : 'Draft'}
                            </p>
                        </div>
                    </div>

                    <ul className={`space-y-1 text-sm ${isConfirmed ? 'text-orange-700' : 'text-red-700'} ml-12`}>
                        <li>✓ Mark the sale as cancelled</li>
                        {isConfirmed && <li>✓ Restore inventory for all items</li>}
                        <li>✗ This action cannot be undone</li>
                    </ul>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${isConfirmed
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                    >
                        {isLoading ? 'Cancelling...' : 'Cancel Sale'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Keep Sale
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CancelSaleModal;