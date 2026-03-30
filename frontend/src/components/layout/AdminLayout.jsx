import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getMainDashboard } from '../../api/dashboard';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';

const AdminLayout = () => {
    const location = useLocation();
    const { adminDashboardData, setAdminDashboardData } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('adminSidebarCollapsed');
        return saved === 'true';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await getMainDashboard();
            setAdminDashboardData(response.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('adminSidebarCollapsed', newState);
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/dashboard') return 'Dashboard';
        if (path === '/dashboard/projects') return 'Projects';
        if (path === '/dashboard/team') return 'Team Members';
        if (path === '/dashboard/profile') return 'My Profile';
        return 'Virelix';
    };

    const notificationCount = () => {
        if (!adminDashboardData) return 0;
        const lowStock = adminDashboardData.low_stock_items?.length || 0;
        const outOfStock = adminDashboardData.out_of_stock_items?.length || 0;
        return lowStock + outOfStock;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <AdminSidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={handleToggleSidebar}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className={`transition-all duration-300 min-h-screen ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
                <TopBar
                    pageTitle={getPageTitle()}
                    notificationCount={notificationCount()}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />
                <main className="pt-16">
                    <div className="p-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;