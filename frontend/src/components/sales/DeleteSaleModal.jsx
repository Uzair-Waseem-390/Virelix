import Modal from '../Modal';

const DeleteSaleModal = ({ isOpen, onClose, sale, onConfirm, isLoading }) => {
    if (!sale) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Sale" size="sm">
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-red-800 mb-1">Delete Sale #{String(sale.id).padStart(3, '0')}?</h3>
                        <p className="text-red-600 text-sm">
                            This draft sale will be permanently deleted. No inventory will be affected.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Keep
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteSaleModal;