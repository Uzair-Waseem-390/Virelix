import { useState, useEffect } from 'react';
import { getProjects } from '../api/projects';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import ProjectSettingsDrawer from '../components/projects/ProjectSettingsDrawer';

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await getProjects();
            // Handle both array response (admin) and single project response (manager/staff)
            let projectsData = [];
            if (Array.isArray(response.data)) {
                projectsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                // Single project response
                projectsData = [response.data];
            }

            // Ensure each project has manager_details and staff_details
            const enrichedProjects = projectsData.map(project => ({
                ...project,
                manager_details: project.manager_details || null,
                staff_details: project.staff_details || null,
                enabled_modules: project.enabled_modules || [],
                has_products: project.has_products || false,
                has_inventory: project.has_inventory || false,
                has_sales: project.has_sales || false
            }));

            setProjects(enrichedProjects);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setError(err.response?.data?.detail || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleProjectCreated = (newProject) => {
        const enrichedProject = {
            ...newProject,
            manager_details: newProject.manager_details || null,
            staff_details: newProject.staff_details || null,
            enabled_modules: newProject.enabled_modules || [],
            has_products: newProject.has_products || false,
            has_inventory: newProject.has_inventory || false,
            has_sales: newProject.has_sales || false
        };
        setProjects(prev => [enrichedProject, ...prev]);
    };

    const handleProjectUpdated = (updatedProject) => {
        setProjects(prev => prev.map(p =>
            p.id === updatedProject.id ? {
                ...updatedProject,
                manager_details: updatedProject.manager_details || p.manager_details,
                staff_details: updatedProject.staff_details || p.staff_details,
                enabled_modules: updatedProject.enabled_modules || p.enabled_modules
            } : p
        ));
    };

    const handleProjectDeleted = (projectId) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    const openDashboard = (projectId) => {
        window.location.href = `/dashboard/projects/${projectId}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="flex justify-between items-center mb-8">
                            <div className="h-8 bg-gray-200 rounded w-48"></div>
                            <div className="h-10 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-xl shadow-md p-6">
                                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                        <p className="text-gray-600 mt-1">Manage your ERP projects</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                        + New Project
                    </button>
                </div>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <svg className="w-32 h-32 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
                        <p className="text-gray-500 mb-6">Create your first project to get started with Virelix</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create New Project
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onOpenDashboard={() => openDashboard(project.id)}
                                onOpenSettings={() => {
                                    setSelectedProject(project);
                                    setShowSettingsDrawer(true);
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Modals */}
                <CreateProjectModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onProjectCreated={handleProjectCreated}
                />

                <ProjectSettingsDrawer
                    isOpen={showSettingsDrawer}
                    onClose={() => {
                        setShowSettingsDrawer(false);
                        setSelectedProject(null);
                    }}
                    project={selectedProject}
                    onProjectUpdate={handleProjectUpdated}
                    onProjectDeleted={handleProjectDeleted}
                />
            </div>
        </div>
    );
};

export default ProjectsPage;