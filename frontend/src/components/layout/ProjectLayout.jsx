import { useState, useEffect } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getProjectDashboard } from '../../api/dashboard';
import ProjectSidebar from './ProjectSidebar';
import TopBar from './TopBar';
import ProjectSettingsDrawer from '../projects/ProjectSettingsDrawer';

const ProjectLayout = () => {
    const location = useLocation();
    const { project_pk } = useParams();
    const { currentProject, setCurrentProject, clearCurrentProject } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('projectSidebarCollapsed');
        return saved === 'true';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProjectData();
        return () => {
            clearCurrentProject();
        };
    }, [project_pk]);

    const fetchProjectData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getProjectDashboard(project_pk);
            setCurrentProject(response.data);
        } catch (err) {
            console.error('Failed to fetch project data:', err);
            setError(err.response?.data?.detail || 'Failed to load project data');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('projectSidebarCollapsed', newState);
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/products')) return 'Products';
        if (path.includes('/inventory/history')) return 'Inventory History';
        if (path.includes('/inventory')) return 'Inventory';
        if (path.includes('/sales')) return 'Sales';
        if (path.includes('/profile')) return 'My Profile';
        return 'Dashboard';
    };

    const notificationCount = () => {
        if (!currentProject) return 0;
        const lowStock = currentProject.low_stock_items?.length || 0;
        const outOfStock = currentProject.out_of_stock_items?.length || 0;
        return lowStock + outOfStock;
    };

    const handleOpenSettings = () => {
        setShowSettingsDrawer(true);
    };

    const handleCloseSettings = () => {
        setShowSettingsDrawer(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Project</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchProjectData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <ProjectSidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={handleToggleSidebar}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
                currentProject={currentProject}
                onOpenSettings={handleOpenSettings}
            />

            <div className={`transition-all duration-300 min-h-screen ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <TopBar
                    pageTitle={getPageTitle()}
                    notificationCount={notificationCount()}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />
                <main className="pt-16">
                    <Outlet />
                </main>
            </div>

            {/* Project Settings Drawer - Moved outside the sidebar */}
            {currentProject && (
                <ProjectSettingsDrawer
                    isOpen={showSettingsDrawer}
                    onClose={handleCloseSettings}
                    project={{ id: project_pk, name: currentProject.project_name }}
                    onProjectUpdate={(updatedProject) => {
                        // Refresh project data after update
                        fetchProjectData();
                    }}
                    onProjectDeleted={() => {
                        handleCloseSettings();
                        window.location.href = '/dashboard/projects';
                    }}
                />
            )}
        </div>
    );
};

export default ProjectLayout;