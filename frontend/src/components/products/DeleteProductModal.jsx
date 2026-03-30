import Modal from '../Modal';

const DeleteProductModal = ({ isOpen, onClose, product, onConfirm, isLoading }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete Product" size="sm">
            <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-red-800 mb-1">Delete "{product?.name}"?</h3>
                        <p className="text-red-600 text-sm">
                            This action is permanent and cannot be undone.
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
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteProductModal;