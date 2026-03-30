import { useState, useEffect } from 'react';
import Modal from '../Modal';
import TabCustomerInfo from './EditSaleModal/TabCustomerInfo';
import TabItems from './EditSaleModal/TabItems';
import { getSale } from '../../api/sales';

const EditSaleModal = ({ isOpen, onClose, saleId, projectId, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('customer');
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && saleId) {
            fetchSale();
        }
    }, [isOpen, saleId]);

    const fetchSale = async () => {
        setLoading(true);
        try {
            const response = await getSale(projectId, saleId);
            setSale(response.data);
        } catch (err) {
            console.error('Failed to fetch sale:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Sale #${String(saleId).padStart(3, '0')}`} size="lg">
            <div className="border-b border-gray-200 mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('customer')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'customer'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Customer Info
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'items'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Items
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : sale && (
                <>
                    {activeTab === 'customer' && (
                        <TabCustomerInfo
                            sale={sale}
                            projectId={projectId}
                            onUpdate={onUpdate}
                            onClose={onClose}
                        />
                    )}
                    {activeTab === 'items' && (
                        <TabItems
                            sale={sale}
                            projectId={projectId}
                            onUpdate={onUpdate}
                            onClose={onClose}
                        />
                    )}
                </>
            )}
        </Modal>
    );
};

export default EditSaleModal;