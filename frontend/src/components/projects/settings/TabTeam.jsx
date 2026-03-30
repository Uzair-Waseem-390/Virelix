import { useState } from 'react';
import { updateManager, updateStaff } from '../../../api/projects';

const TabTeam = ({ project, onUpdate }) => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEdit = (type) => {
        setEditing(type);
        setFormData({ email: '', password: '' });
        setError('');
        setSuccess('');
    };

    const handleSave = async (type) => {
        setError('');
        setSuccess('');

        const updates = {};
        if (formData.email) updates.email = formData.email;
        if (formData.password) updates.password = formData.password;

        if (Object.keys(updates).length === 0) {
            setEditing(null);
            return;
        }

        setIsSaving(true);

        try {
            if (type === 'manager') {
                const response = await updateManager(project.id, updates);
                setSuccess('Manager credentials updated successfully!');
                onUpdate({
                    ...project,
                    manager_details: response.data.manager
                });
            } else {
                const response = await updateStaff(project.id, updates);
                setSuccess('Staff credentials updated successfully!');
                onUpdate({
                    ...project,
                    staff_details: response.data.staff
                });
            }
            setEditing(null);
            setFormData({ email: '', password: '' });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update credentials');
        } finally {
            setIsSaving(false);
        }
    };

    const MemberCard = ({ type }) => {
        const isManager = type === 'manager';
        const title = isManager ? 'Manager' : 'Staff';
        const color = isManager ? 'blue' : 'green';

        // Get member data safely
        const member = isManager ? project.manager_details : project.staff_details;

        // If member data is not available, show message
        if (!member) {
            return (
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className={`font-semibold text-${color}-600`}>{title}</h4>
                            <p className="text-sm text-gray-500 mt-1">No {title.toLowerCase()} assigned to this project</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className={`font-semibold text-${color}-600`}>{title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{member.email || 'No email set'}</p>
                        <span className={`inline-flex mt-2 px-2 py-1 rounded-full text-xs font-medium ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <button
                        onClick={() => handleEdit(type)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        Edit Credentials
                    </button>
                </div>

                {editing === type && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Email (optional)
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={member.email}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password (optional, min 8 chars)
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter new password"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <p className="text-green-600 text-sm">{success}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave(type)}
                                    disabled={isSaving}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditing(null);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Check if project has member data
    const hasManager = !!project.manager_details;
    const hasStaff = !!project.staff_details;

    return (
        <div className="space-y-4">
            <MemberCard type="manager" />
            <MemberCard type="staff" />

            {(!hasManager || !hasStaff) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-blue-700 text-sm">
                        💡 Team members are automatically created when the project is set up.
                        If they're not showing, the project may still be initializing.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TabTeam;