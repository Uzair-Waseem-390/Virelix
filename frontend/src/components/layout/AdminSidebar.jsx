import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import CreateProjectModal from '../projects/CreateProjectModal';

const AdminSidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { adminDashboardData, logout } = useAuthStore();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Exact match for top-level routes, startsWith for nested routes
    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        if (path === '/dashboard/projects') {
            return location.pathname === '/dashboard/projects';
        }
        if (path === '/dashboard/team') {
            return location.pathname === '/dashboard/team';
        }
        if (path === '/dashboard/profile') {
            return location.pathname === '/dashboard/profile';
        }
        // For project enter routes, don't mark as active
        if (path.startsWith('/dashboard/projects/') && path.includes('/enter')) {
            return false;
        }
        return location.pathname.startsWith(path + '/');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navSections = [
        {
            title: 'OVERVIEW',
            items: [
                { path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Main Dashboard' }
            ]
        },
        {
            title: 'WORKSPACE',
            items: [
                { path: '/dashboard/projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'My Projects' },
                { path: '/dashboard/team', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Team Members' },
                { path: '/dashboard/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'My Profile' }
            ]
        }
    ];

    const projects = adminDashboardData?.projects || [];

    return (
        <>
            <aside
                className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 overflow-hidden fixed inset-y-0 left-0 ${isMobileOpen ? 'z-50' : 'hidden lg:flex z-20'
                    } ${isCollapsed ? 'w-16' : 'w-64'}`}
            >
                {/* Logo - Fixed height, no overflow */}
                <div className={`h-16 flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-slate-700`}>
                    {!isCollapsed ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                    </svg>
                                </div>
                                <span className="text-white font-bold truncate">Virelix</span>
                            </div>
                            <button onClick={onToggle} className="p-1 rounded hover:bg-slate-800 flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button onClick={onToggle} className="p-1 rounded hover:bg-slate-800">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Navigation - Scrollable area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                    {navSections.map((section, idx) => (
                        <div key={idx} className="mb-6">
                            {!isCollapsed && (
                                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {section.title}
                                </div>
                            )}
                            {section.items.map((item, itemIdx) => (
                                <Link
                                    key={itemIdx}
                                    to={item.path}
                                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 mx-2 rounded-lg transition-colors ${isActive(item.path)
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                    {!isCollapsed && <span className="ml-3 text-sm truncate">{item.label}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}

                    {/* MY PROJECTS section */}
                    {projects.length > 0 && (
                        <div className="mb-6">
                            {!isCollapsed && (
                                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    MY PROJECTS
                                </div>
                            )}
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    to={`/dashboard/projects/${project.id}/enter`}
                                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 mx-2 rounded-lg transition-colors hover:bg-slate-800 hover:text-white`}
                                    title={isCollapsed ? project.name : ''}
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                                    {!isCollapsed && <span className="ml-3 text-sm truncate">{project.name}</span>}
                                </Link>
                            ))}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 mx-2 rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white w-full`}
                                title={isCollapsed ? 'New Project' : ''}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {!isCollapsed && <span className="ml-3 text-sm">New Project</span>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer - Logout - Fixed at bottom */}
                <div className="flex-shrink-0 p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'px-2'} py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full`}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {!isCollapsed && <span className="ml-3 text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={onMobileClose}></div>
            )}

            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onProjectCreated={() => {
                    setShowCreateModal(false);
                    window.location.reload();
                }}
            />
        </>
    );
};

export default AdminSidebar;