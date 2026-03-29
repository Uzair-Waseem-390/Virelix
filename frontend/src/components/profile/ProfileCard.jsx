import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { updateMyProfile } from '../../api/accounts';

const ProfileCard = ({ profile, onProfileUpdate }) => {
    const { user, setUserEmail } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        email: profile?.email || '',
        gemini_api_key: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleEdit = () => {
        setFormData({
            email: profile?.email || '',
            gemini_api_key: '',
        });
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({ email: profile?.email || '', gemini_api_key: '' });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const updateData = {};
            if (formData.email !== profile?.email) {
                updateData.email = formData.email;
            }
            if (formData.gemini_api_key) {
                updateData.gemini_api_key = formData.gemini_api_key;
            }

            if (Object.keys(updateData).length === 0) {
                setError('No changes to update');
                setIsLoading(false);
                return;
            }

            const response = await updateMyProfile(updateData);

            // Update Zustand store with new email
            if (updateData.email) {
                setUserEmail(updateData.email);
            }

            onProfileUpdate(response.data);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            setFormData({ email: '', gemini_api_key: '' });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'manager': return 'bg-blue-100 text-blue-800';
            case 'staff': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Profile Information</h3>
            </div>

            <div className="p-6">
                {!isEditing ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-3 flex-1">
                                <div>
                                    <label className="text-sm text-gray-500">Email</label>
                                    <p className="text-gray-900 font-medium">{profile?.email}</p>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Role</label>
                                    <div>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile?.role)}`}>
                                            {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Account Status</label>
                                    <div>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {profile?.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Member Since</label>
                                    <p className="text-gray-900">{profile?.created_at ? formatDate(profile.created_at) : 'N/A'}</p>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Gemini API Key</label>
                                    <div>
                                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${profile?.has_gemini_key ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {profile?.has_gemini_key ? '✓ Configured' : '✗ Not set'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {profile?.role === 'admin' && (
                                <button
                                    onClick={handleEdit}
                                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gemini API Key
                            </label>
                            <input
                                type="text"
                                value={formData.gemini_api_key}
                                onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                                placeholder="Enter new API key (optional)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Updating your key will validate it against Google AI Studio before saving
                            </p>
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

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfileCard;