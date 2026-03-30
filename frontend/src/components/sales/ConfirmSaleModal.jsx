import Modal from '../Modal';
import { formatCurrency } from '../../utils/form';
import SaleItemsTable from './SaleItemsTable';

const ConfirmSaleModal = ({ isOpen, onClose, sale, onConfirm, isLoading }) => {
    if (!sale) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Confirm Sale" size="md">
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800">Confirm Sale #{String(sale.id).padStart(3, '0')}</h3>
                            <p className="text-sm text-green-600">This will mark the sale as confirmed and deduct inventory</p>
                        </div>
                    </div>

                    <div className="mt-3">
                        <p className="text-sm text-green-700 font-medium mb-2">Items to be deducted:</p>
                        <SaleItemsTable items={sale.items || []} editable={false} />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Confirming...' : 'Confirm Sale'}
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

export default ConfirmSaleModal;