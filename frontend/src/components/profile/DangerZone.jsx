import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { deleteMyAccount } from '../../api/accounts';
import Modal from '../Modal';

const DangerZone = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') return;

        setIsLoading(true);
        setError('');

        try {
            await deleteMyAccount();
            logout();
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete account');
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="border-2 border-red-200 rounded-2xl bg-red-50 overflow-hidden">
                <div className="bg-red-100 px-6 py-4 border-b border-red-200">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-red-700 mb-4">
                        Once you delete your account, there is no going back. This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside text-red-600 text-sm mb-4 space-y-1">
                        <li>Your account and all personal information</li>
                        <li>All projects you've created</li>
                        <li>All managers and staff members associated with your projects</li>
                        <li>All products, inventory, and sales data</li>
                    </ul>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete My Account
                    </button>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Delete Account">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone</p>
                        <p className="text-red-600 text-sm">
                            This will permanently delete your account and ALL associated data.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type <span className="font-mono font-bold">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                            placeholder="DELETE"
                            autoComplete="off"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETE' || isLoading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Deleting...' : 'Permanently Delete'}
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DangerZone;