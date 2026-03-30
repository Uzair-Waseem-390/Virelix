import { useState } from 'react';
import Modal from '../Modal';
import StepCustomerInfo from './CreateSaleModal/StepCustomerInfo';
import StepAddItems from './CreateSaleModal/StepAddItems';

const CreateSaleModal = ({ isOpen, onClose, projectId, onSubmit, isLoading }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        customer_name: '',
        customer_phone: '',
        note: ''
    });
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    let nextItemId = 1;

    const resetForm = () => {
        setStep(1);
        setFormData({
            customer_name: '',
            customer_phone: '',
            note: ''
        });
        setItems([]);
        setError('');
        nextItemId = 1;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = (item) => {
        setItems(prev => [...prev, { ...item, id: nextItemId++ }]);
        setError('');
    };

    const handleUpdateItem = (itemId, updates) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
    };

    const handleRemoveItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSubmit = async () => {
        // Validate items
        if (items.length === 0) {
            setError('Please add at least one item to the sale');
            return;
        }

        const saleData = {
            ...formData,
            items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price
            }))
        };

        console.log('Creating sale with data:', saleData); // Debug log

        const result = await onSubmit(saleData);

        // If successful, reset and close
        if (result?.success !== false) {
            resetForm();
            onClose();
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Sale" size="lg">
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}
            {step === 1 && (
                <StepCustomerInfo
                    formData={formData}
                    onChange={handleChange}
                    onNext={() => setStep(2)}
                />
            )}
            {step === 2 && (
                <StepAddItems
                    projectId={projectId}
                    items={items}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                    onUpdateItem={handleUpdateItem}
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    isSubmitting={isLoading}
                />
            )}
        </Modal>
    );
};

export default CreateSaleModal;