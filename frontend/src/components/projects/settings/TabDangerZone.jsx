import { useState } from 'react';
import { deleteProject } from '../../../api/projects';

const TabDangerZone = ({ project, onProjectDeleted, onClose }) => {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (confirmText !== project.name) return;

        setIsDeleting(true);
        setError('');

        try {
            await deleteProject(project.id);
            onProjectDeleted(project.id);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete project');
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-2">Delete Project</h4>
                        <p className="text-red-700 text-sm mb-3">
                            This action cannot be undone. This will permanently delete the project "{project.name}"
                            and remove the manager and staff accounts linked to it.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-red-800 mb-2">
                                    Type <span className="font-mono font-bold">{project.name}</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                                    placeholder={project.name}
                                    autoComplete="off"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-300 rounded-lg p-2">
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleDelete}
                                disabled={confirmText !== project.name || isDeleting}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? 'Deleting...' : 'Permanently Delete Project'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TabDangerZone;