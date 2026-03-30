import { formatDistanceToNow } from 'date-fns';
import ModuleBadge from './ModuleBadge';

const ProjectCard = ({ project, onOpenDashboard, onOpenSettings }) => {
    const getAIStatusBadge = () => {
        switch (project.ai_status) {
            case 'pending':
            case 'processing':
                return (
                    <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        Analyzing...
                    </div>
                );
            case 'done':
                return (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Ready
                    </div>
                );
            case 'failed':
                return (
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✗ Setup Failed
                    </div>
                );
            default:
                return null;
        }
    };

    const getRelativeTime = (date) => {
        if (!date) return 'Recently';
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch (error) {
            return 'Recently';
        }
    };

    return (
        <div
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden group"
            onClick={onOpenDashboard}
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {project.name || 'Unnamed Project'}
                    </h3>
                    {getAIStatusBadge()}
                </div>

                {/* Modules */}
                {project.ai_status === 'done' && project.enabled_modules?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {project.enabled_modules.map(module => (
                            <ModuleBadge key={module} module={module} size="sm" />
                        ))}
                    </div>
                )}

                {/* Created Date */}
                <p className="text-sm text-gray-500 mb-4">
                    Created {getRelativeTime(project.created_at)}
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenDashboard();
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Open Dashboard
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenSettings();
                        }}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;