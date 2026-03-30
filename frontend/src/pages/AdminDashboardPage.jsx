import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/projects/ProjectCard';
import AlertBanner from '../components/common/AlertBanner';
import SalesOverviewSection from '../components/common/SalesOverviewSection';
import CreateProjectModal from '../components/projects/CreateProjectModal';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const { adminDashboardData, setAdminDashboardData } = useAuthStore();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = adminDashboardData?.user?.email?.split('@')[0] || 'Admin';
        if (hour < 12) return `Good morning, ${name}`;
        if (hour < 17) return `Good afternoon, ${name}`;
        if (hour < 21) return `Good evening, ${name}`;
        return `Good night, ${name}`;
    };

    const stats = [
        { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Total Projects', value: adminDashboardData?.projects?.length || 0, color: 'blue' },
        { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Total Products', value: adminDashboardData?.total_products || 0, color: 'green' },
        { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Confirmed Sales', value: adminDashboardData?.total_confirmed_sales || 0, color: 'purple' },
        { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Total Revenue', value: adminDashboardData?.total_revenue || 0, color: 'orange' }
    ];

    const projects = adminDashboardData?.projects || [];
    const lowStockItems = adminDashboardData?.low_stock_items || [];
    const outOfStockItems = adminDashboardData?.out_of_stock_items || [];

    const handleProjectClick = (project) => {
        navigate(`/dashboard/projects/${project.id}`);
    };

    const handleAlertClick = (item) => {
        navigate(`/dashboard/projects/${item.project_id}/inventory`);
    };

    const handleViewConfirmed = () => {
        navigate('/dashboard/projects');
    };

    const handleViewDraft = () => {
        navigate('/dashboard/projects');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{getGreeting()}</h1>
                <p className="text-gray-600 mt-2">Here's what's happening across all your projects.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <StatCard key={idx} {...stat} />
                ))}
            </div>

            {/* Projects Section */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">My Projects</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + New Project
                    </button>
                </div>

                {projects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No projects yet</h3>
                        <p className="text-gray-500 mb-6">Create your first project to get started with Virelix</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create New Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onOpenDashboard={() => handleProjectClick(project)}
                                onOpenSettings={() => { }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Alerts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertBanner
                    type="out_of_stock"
                    items={outOfStockItems}
                    onItemClick={handleAlertClick}
                    projectContext={false}
                />
                <AlertBanner
                    type="low_stock"
                    items={lowStockItems}
                    onItemClick={handleAlertClick}
                    projectContext={false}
                />
            </div>

            {/* Sales Overview */}
            <SalesOverviewSection
                totalConfirmed={adminDashboardData?.total_confirmed_sales || 0}
                totalDraft={adminDashboardData?.total_draft_sales || 0}
                totalRevenue={adminDashboardData?.total_revenue || 0}
                onViewConfirmed={handleViewConfirmed}
                onViewDraft={handleViewDraft}
            />

            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onProjectCreated={() => {
                    setShowCreateModal(false);
                    fetchDashboardData();
                }}
            />
        </div>
    );
};

export default AdminDashboardPage;