import { useState } from 'react';
import { updateProject, getAIStatus } from '../../../api/projects';

const TabGeneral = ({ project, onProjectUpdate }) => {
    const [formData, setFormData] = useState({
        name: project.name,
        description: project.description
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [aiProgress, setAiProgress] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(null);

    const handleSave = async () => {
        setError('');
        setSuccess('');

        const updates = {};
        if (formData.name !== project.name) updates.name = formData.name;
        if (formData.description !== project.description) updates.description = formData.description;

        if (Object.keys(updates).length === 0) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);

        try {
            const response = await updateProject(project.id, updates);
            onProjectUpdate(response.data.project);

            if (response.data.task_id) {
                // Description changed, AI re-running
                setShowConfirm(false);
                setAiProgress({ status: 'processing', message: 'AI re-analyzing business description...' });

                const interval = setInterval(async () => {
                    try {
                        const statusResponse = await getAIStatus(project.id, response.data.task_id);
                        if (statusResponse.data.ai_status === 'done') {
                            clearInterval(interval);
                            setAiProgress(null);
                            setSuccess('Project updated and AI analysis completed!');
                            setIsEditing(false);
                            // Update project with new modules
                            onProjectUpdate({
                                ...response.data.project,
                                enabled_modules: statusResponse.data.enabled_modules,
                                has_products: statusResponse.data.has_products,
                                has_inventory: statusResponse.data.has_inventory,
                                has_sales: statusResponse.data.has_sales
                            });
                        } else if (statusResponse.data.ai_status === 'failed') {
                            clearInterval(interval);
                            setAiProgress(null);
                            setError('AI re-analysis failed: ' + statusResponse.data.ai_error);
                        }
                    } catch (err) {
                        clearInterval(interval);
                        setAiProgress(null);
                        setError('Failed to check AI status');
                    }
                }, 3000);

                setPollingInterval(interval);
            } else {
                setSuccess('Project updated successfully!');
                setIsEditing(false);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update project');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDescriptionChange = () => {
        if (formData.description !== project.description) {
            setShowConfirm(true);
        } else {
            handleSave();
        }
    };

    // Cleanup on unmount
    const cleanup = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    };

    if (!isEditing) {
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name
                    </label>
                    <p className="text-gray-900">{project.name}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Description
                    </label>
                    <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI Status
                    </label>
                    <div className="flex items-center gap-2">
                        {project.ai_status === 'done' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                ✓ Ready
                            </span>
                        )}
                        {project.enabled_modules?.length > 0 && (
                            <span className="text-sm text-gray-500">
                                Modules: {project.enabled_modules.join(', ')}
                            </span>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Edit Project
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-amber-600">
                    ⚠️ Changing the description will re-run AI analysis and may change which modules are enabled.
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

            {aiProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-blue-600 text-sm">{aiProgress.message}</p>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleDescriptionChange}
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: project.name, description: project.description });
                        setError('');
                        setSuccess('');
                        cleanup();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
            </div>

            {showConfirm && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm mb-3">
                        Changing the description will trigger a new AI analysis. This may change which modules are enabled for this project.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowConfirm(false);
                                handleSave();
                            }}
                            className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
                        >
                            Continue
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-3 py-1 border border-amber-300 text-amber-700 rounded text-sm hover:bg-amber-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabGeneral;