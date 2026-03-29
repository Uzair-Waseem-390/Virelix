import { useState } from 'react';
import { changeMyPassword } from '../../api/accounts';

const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.new_password !== formData.confirm_password) {
            setError('New passwords do not match');
            return;
        }

        if (formData.new_password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await changeMyPassword({
                old_password: formData.old_password,
                new_password: formData.new_password,
            });

            setSuccess('Password changed successfully!');
            setFormData({
                old_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={formData.old_password}
                            onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={formData.new_password}
                            onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-600 text-sm">{success}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordForm;