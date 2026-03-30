import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ProjectSidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose, currentProject, onOpenSettings }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { project_pk } = useParams();

    // Exact match for each route
    const isActive = (path) => {
        return location.pathname === path;
    };

    // For checking if a module section should be expanded (if any sub-route is active)
    const isModuleActive = (modulePath) => {
        return location.pathname.startsWith(modulePath);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user?.role === 'admin';
    const enabledModules = currentProject?.enabled_modules || [];

    const navItems = [
        { path: `/dashboard/projects/${project_pk}`, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Project Dashboard' },
        { path: `/dashboard/profile`, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'My Profile' }
    ];

    const moduleLinks = {
        products: {
            path: `/dashboard/projects/${project_pk}/products`,
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            label: 'Products'
        },
        inventory: {
            path: `/dashboard/projects/${project_pk}/inventory`,
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            label: 'Inventory'
        },
        sales: {
            path: `/dashboard/projects/${project_pk}/sales`,
            icon: 'M9 8h6m-5 0v8m4-8v8M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z',
            label: 'Sales'
        }
    };

    // History requires an inventoryId - sidebar link goes to inventory page instead
    const inventorySubItems = [];

    const getRoleColor = () => {
        switch (user?.role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'manager': return 'bg-blue-100 text-blue-800';
            case 'staff': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Check if any inventory sub-route is active
    const isInventoryActive = isModuleActive(`/dashboard/projects/${project_pk}/inventory`);

    return (
        <>
            <aside
                className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 overflow-hidden fixed inset-y-0 left-0 ${isMobileOpen ? 'z-50' : 'hidden lg:flex z-20'
                    } ${isCollapsed ? 'w-16' : 'w-64'}`}
            >
                {/* Header - Fixed */}
                <div className={`h-16 flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-slate-700`}>
                    {!isCollapsed ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                    </svg>
                                </div>
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

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
                    {/* Project Info */}
                    {!isCollapsed && currentProject && (
                        <div className="px-4 py-2 mb-2 border-b border-slate-700">
                            <div className="font-bold text-white truncate">{currentProject.project_name}</div>
                            <div className="mt-1">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}>
                                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Back to Projects (admin only) */}
                    {isAdmin && !isCollapsed && (
                        <Link
                            to="/dashboard/projects"
                            className="mx-2 mb-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            ← Back to Projects
                        </Link>
                    )}

                    {/* Navigation Items */}
                    {navItems.map((item, idx) => (
                        <Link
                            key={idx}
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

                    {/* Module Links */}
                    {enabledModules.map((module) => {
                        const link = moduleLinks[module];
                        if (!link) return null;
                        const isModuleRouteActive = isActive(link.path) || (module === 'inventory' && isInventoryActive);

                        return (
                            <div key={module}>
                                <Link
                                    to={link.path}
                                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2 mx-2 rounded-lg transition-colors ${isModuleRouteActive
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    title={isCollapsed ? link.label : ''}
                                >
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                                    </svg>
                                    {!isCollapsed && <span className="ml-3 text-sm truncate">{link.label}</span>}
                                </Link>
                                {/* Inventory sub-items */}
                                {module === 'inventory' && !isCollapsed && (
                                    <div className="ml-8 space-y-1 mt-1">
                                        {inventorySubItems.map((subItem, subIdx) => (
                                            <Link
                                                key={subIdx}
                                                to={subItem.path}
                                                className={`block px-4 py-1.5 text-sm rounded-lg transition-colors ${isActive(subItem.path)
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                                    }`}
                                            >
                                                {subItem.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Project Settings (admin only) */}
                    {isAdmin && !isCollapsed && (
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center w-full px-4 py-2 mx-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="ml-3 text-sm">Project Settings</span>
                        </button>
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
        </>
    );
};

export default ProjectSidebar;