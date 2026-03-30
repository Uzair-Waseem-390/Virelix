import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import StatCard from '../components/common/StatCard';
import AlertBanner from '../components/common/AlertBanner';
import SalesOverviewSection from '../components/common/SalesOverviewSection';
import ModuleBadge from '../components/projects/ModuleBadge';

const ProjectDashboardPage = () => {
    const navigate = useNavigate();
    const { currentProject } = useAuthStore();

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading project data...</p>
            </div>
        );
    }

    const getAIStatusBadge = () => {
        switch (currentProject.ai_status) {
            case 'pending':
            case 'processing':
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Analyzing...</span>;
            case 'done':
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ready</span>;
            case 'failed':
                return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Setup Failed</span>;
            default:
                return null;
        }
    };

    const stats = [];

    if (currentProject.has_products) {
        stats.push({
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            label: 'Total Products',
            value: currentProject.total_products || 0,
            color: 'blue'
        });
    }

    if (currentProject.has_inventory) {
        stats.push({
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            label: 'Low Stock Items',
            value: (currentProject.low_stock_items?.length || 0) + (currentProject.out_of_stock_items?.length || 0),
            color: 'orange'
        });
    }

    if (currentProject.has_sales) {
        stats.push({
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            label: 'Confirmed Sales',
            value: currentProject.total_confirmed_sales || 0,
            color: 'purple'
        });
        stats.push({
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            label: 'Total Revenue',
            value: currentProject.total_revenue || 0,
            color: 'green'
        });
    }

    const lowStockItems = currentProject.low_stock_items || [];
    const outOfStockItems = currentProject.out_of_stock_items || [];

    const handleAlertClick = (item) => {
        navigate(`/dashboard/projects/${currentProject.project_id}/inventory`);
    };

    const handleViewConfirmed = () => {
        navigate(`/dashboard/projects/${currentProject.project_id}/sales?status=confirmed`);
    };

    const handleViewDraft = () => {
        navigate(`/dashboard/projects/${currentProject.project_id}/sales?status=draft`);
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900">{currentProject.project_name}</h1>
                    {getAIStatusBadge()}
                </div>
                {currentProject.enabled_modules?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {currentProject.enabled_modules.map(module => (
                            <ModuleBadge key={module} module={module} size="sm" />
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Row */}
            {stats.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <StatCard key={idx} {...stat} />
                    ))}
                </div>
            )}

            {/* Alerts Section (only if inventory enabled) */}
            {currentProject.has_inventory && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AlertBanner
                        type="out_of_stock"
                        items={outOfStockItems}
                        onItemClick={handleAlertClick}
                        projectContext={true}
                    />
                    <AlertBanner
                        type="low_stock"
                        items={lowStockItems}
                        onItemClick={handleAlertClick}
                        projectContext={true}
                    />
                </div>
            )}

            {/* Sales Overview (only if sales enabled) */}
            {currentProject.has_sales && (
                <SalesOverviewSection
                    totalConfirmed={currentProject.total_confirmed_sales || 0}
                    totalDraft={currentProject.total_draft_sales || 0}
                    totalRevenue={currentProject.total_revenue || 0}
                    onViewConfirmed={handleViewConfirmed}
                    onViewDraft={handleViewDraft}
                />
            )}
        </div>
    );
};

export default ProjectDashboardPage;