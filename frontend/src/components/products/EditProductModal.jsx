import Modal from '../Modal';
import ProductForm from './ProductForm';
import { getDirtyFields } from '../../utils/form';

const EditProductModal = ({ isOpen, onClose, product, onSubmit, isLoading }) => {
    const handleSubmit = (formData) => {
        const dirtyFields = getDirtyFields(product, formData);
        if (Object.keys(dirtyFields).length > 0) {
            onSubmit(dirtyFields);
        } else {
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Product" size="md">
            <ProductForm
                initialValues={product}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={isLoading}
            />
        </Modal>
    );
};

export default EditProductModal;