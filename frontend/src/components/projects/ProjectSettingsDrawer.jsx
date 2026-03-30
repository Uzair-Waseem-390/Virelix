import { useState, useEffect } from 'react';
import TabGeneral from './settings/TabGeneral';
import TabTeam from './settings/TabTeam';
import TabDangerZone from './settings/TabDangerZone';
import { getProject } from '../../api/projects';

const ProjectSettingsDrawer = ({ isOpen, onClose, project, onProjectUpdate, onProjectDeleted }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [fullProject, setFullProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && project?.id) {
            fetchFullProject();
        }
    }, [isOpen, project?.id]);

    const fetchFullProject = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await getProject(project.id);
            setFullProject(response.data);
            console.log('Full project data:', response.data); // Debug log
        } catch (err) {
            console.error('Failed to fetch project details:', err);
            setError(err.response?.data?.detail || 'Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'General', icon: 'M4 6h16M4 12h16M4 18h16' },
        { id: 'team', label: 'Team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-40 transform transition-transform animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Project Settings</h2>
                        <p className="text-sm text-gray-500 mt-1">{project?.name || 'Unnamed Project'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                            <div className="space-y-3">
                                <div className="h-20 bg-gray-200 rounded"></div>
                                <div className="h-20 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="p-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-600 text-sm">{error}</p>
                            <button
                                onClick={fetchFullProject}
                                className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {!loading && !error && fullProject && (
                    <>
                        <div className="border-b border-gray-200">
                            <div className="flex px-6">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                                ? 'text-blue-600 border-b-2 border-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                        </svg>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
                            {activeTab === 'general' && (
                                <TabGeneral project={fullProject} onProjectUpdate={(updated) => {
                                    setFullProject(updated);
                                    onProjectUpdate(updated);
                                }} />
                            )}
                            {activeTab === 'team' && (
                                <TabTeam project={fullProject} onUpdate={(updated) => {
                                    setFullProject(updated);
                                    onProjectUpdate(updated);
                                }} />
                            )}
                            {activeTab === 'danger' && (
                                <TabDangerZone
                                    project={fullProject}
                                    onProjectDeleted={onProjectDeleted}
                                    onClose={onClose}
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            <style>{`
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
        </>
    );
};

export default ProjectSettingsDrawer;