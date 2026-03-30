import Modal from '../Modal';
import ProductForm from './ProductForm';

const AddProductModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Product" size="md">
            <ProductForm
                initialValues={{}}
                onSubmit={onSubmit}
                onCancel={onClose}
                isLoading={isLoading}
            />
        </Modal>
    );
};

export default AddProductModal;