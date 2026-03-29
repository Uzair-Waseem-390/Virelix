import { useState } from 'react';
import Modal from '../Modal';
import { updateMember } from '../../api/accounts';

const EditMemberModal = ({ isOpen, onClose, member, onUpdate }) => {
    const [email, setEmail] = useState(member?.email || '');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await updateMember(member.id, { email });
            onUpdate(response.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update member');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Team Member">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditMemberModal;