import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ProjectSidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose, currentProject, onOpenSettings }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { project_pk } = useParams();
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    const isActive = (path) => location.pathname === path;
    const isModuleActive = (modulePath) => location.pathname.startsWith(modulePath);
    const handleLogout = () => { logout(); navigate('/login'); };

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
            label: 'Products',
            color: '#60a5fa'
        },
        inventory: {
            path: `/dashboard/projects/${project_pk}/inventory`,
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            label: 'Inventory',
            color: '#34d399'
        },
        sales: {
            path: `/dashboard/projects/${project_pk}/sales`,
            icon: 'M9 8h6m-5 0v8m4-8v8M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z',
            label: 'Sales',
            color: '#f472b6'
        }
    };

    const getRoleConfig = () => {
        switch (user?.role) {
            case 'admin':   return { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa', dot: '#8b5cf6' };
            case 'manager': return { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', dot: '#3b82f6' };
            case 'staff':   return { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', dot: '#64748b' };
            default:        return { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', dot: '#64748b' };
        }
    };

    const roleConfig = getRoleConfig();
    const isInventoryActive = isModuleActive(`/dashboard/projects/${project_pk}/inventory`);
    const inventorySubItems = [];

    return (
        <>
            <style>{`
                @keyframes vx-slide-in {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes vx-glow-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
                    50%       { box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
                }
                @keyframes vx-shimmer-move {
                    0%   { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(220%) skewX(-12deg); }
                }
                @keyframes vx-role-badge-in {
                    from { opacity: 0; transform: scale(0.85) translateY(4px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes vx-project-name-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes vx-settings-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(90deg); }
                }

                .vx-sidebar-item {
                    position: relative;
                    overflow: hidden;
                    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .vx-sidebar-item::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, rgba(99,102,241,0.08), transparent);
                    opacity: 0;
                    transition: opacity 0.22s ease;
                    border-radius: inherit;
                }
                .vx-sidebar-item:hover::before { opacity: 1; }

                .vx-sidebar-item::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 40%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
                    transform: translateX(-100%) skewX(-12deg);
                    pointer-events: none;
                }
                .vx-sidebar-item:hover::after {
                    animation: vx-shimmer-move 0.55s ease forwards;
                }

                .vx-active-indicator {
                    position: absolute;
                    left: 0; top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 0;
                    background: linear-gradient(180deg, #6366f1, #3b82f6);
                    border-radius: 0 2px 2px 0;
                    transition: height 0.3s cubic-bezier(0.4,0,0.2,1);
                    box-shadow: 0 0 6px rgba(99,102,241,0.6);
                }
                .vx-sidebar-item.is-active .vx-active-indicator { height: 70%; }

                .vx-section-label {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    color: rgba(148,163,184,0.45);
                }

                .vx-nav-mounted .vx-nav-item {
                    animation: vx-slide-in 0.35s ease both;
                }
                .vx-nav-mounted .vx-nav-item:nth-child(1) { animation-delay: 0.05s; }
                .vx-nav-mounted .vx-nav-item:nth-child(2) { animation-delay: 0.10s; }
                .vx-nav-mounted .vx-nav-item:nth-child(3) { animation-delay: 0.15s; }
                .vx-nav-mounted .vx-nav-item:nth-child(4) { animation-delay: 0.20s; }
                .vx-nav-mounted .vx-nav-item:nth-child(5) { animation-delay: 0.25s; }
                .vx-nav-mounted .vx-nav-item:nth-child(6) { animation-delay: 0.30s; }

                .vx-project-info {
                    animation: vx-project-name-in 0.4s ease both;
                }
                .vx-role-badge {
                    animation: vx-role-badge-in 0.4s 0.1s ease both;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 2px 8px;
                    border-radius: 99px;
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.01em;
                }

                .vx-module-icon-wrap {
                    width: 28px; height: 28px;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.22s ease;
                }

                .vx-settings-btn {
                    transition: all 0.22s ease;
                    border: 1px solid transparent;
                }
                .vx-settings-btn:hover {
                    background: rgba(99,102,241,0.08);
                    border-color: rgba(99,102,241,0.2);
                }
                .vx-settings-btn:hover .vx-settings-icon {
                    animation: vx-settings-spin 0.4s ease forwards;
                }

                .vx-logout-btn {
                    transition: all 0.22s ease;
                    border: 1px solid transparent;
                }
                .vx-logout-btn:hover {
                    background: rgba(239,68,68,0.08) !important;
                    border-color: rgba(239,68,68,0.2);
                    color: #f87171 !important;
                }

                .vx-back-btn {
                    transition: all 0.22s ease;
                    border: 1px solid transparent;
                }
                .vx-back-btn:hover {
                    background: rgba(148,163,184,0.06);
                    border-color: rgba(148,163,184,0.1);
                    transform: translateX(-2px);
                }

                .vx-toggle-btn {
                    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
                }
                .vx-toggle-btn:hover {
                    background: rgba(99,102,241,0.15);
                    color: #a5b4fc;
                }

                .vx-sidebar-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(148,163,184,0.1), transparent);
                    margin: 6px 16px;
                }
            `}</style>

            <aside
                className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 overflow-hidden fixed inset-y-0 left-0 ${isMobileOpen ? 'z-50' : 'hidden lg:flex z-20'} ${isCollapsed ? 'w-16' : 'w-64'}`}
                style={{ borderRight: '1px solid rgba(148,163,184,0.07)' }}
            >
                {/* Top accent */}
                <div style={{ height: 2, background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)', flexShrink: 0 }} />

                {/* Header */}
                <div className={`h-16 flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'}`}
                    style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                    {!isCollapsed ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/40"
                                    style={{ animation: 'vx-glow-pulse 3s ease-in-out infinite' }}>
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                    </svg>
                                </div>
                            </div>
                            <button onClick={onToggle} className="vx-toggle-btn p-1.5 rounded-lg text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button onClick={onToggle} className="vx-toggle-btn p-1.5 rounded-lg text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Scrollable */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden py-3 ${mounted ? 'vx-nav-mounted' : ''}`}
                    style={{ scrollbarWidth: 'none' }}>

                    {/* Project info block */}
                    {!isCollapsed && currentProject && (
                        <div className="vx-project-info mx-3 mb-3 px-3 py-3 rounded-xl"
                            style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}>
                            <p className="text-white font-semibold text-sm truncate leading-tight mb-1.5"
                                style={{ letterSpacing: '-0.01em' }}>
                                {currentProject.project_name}
                            </p>
                            <span className="vx-role-badge"
                                style={{ background: roleConfig.bg, color: roleConfig.color }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: roleConfig.dot, boxShadow: `0 0 4px ${roleConfig.dot}` }} />
                                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                            </span>
                        </div>
                    )}

                    {/* Back to Projects (admin only) */}
                    {isAdmin && !isCollapsed && (
                        <div className="px-2 mb-2">
                            <Link
                                to="/dashboard/projects"
                                className="vx-back-btn flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-sm"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="text-xs font-medium">Back to Projects</span>
                            </Link>
                        </div>
                    )}

                    <div className="vx-sidebar-divider" />

                    {/* Nav items */}
                    <div className="mt-2 mb-4">
                        {!isCollapsed && (
                            <div className="px-4 mb-2">
                                <span className="vx-section-label">NAVIGATION</span>
                            </div>
                        )}
                        {navItems.map((item, idx) => {
                            const active = isActive(item.path);
                            return (
                                <div key={idx} className="vx-nav-item px-2 mb-0.5">
                                    <Link
                                        to={item.path}
                                        onMouseEnter={() => setHoveredItem(item.path)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                        className={`vx-sidebar-item ${active ? 'is-active' : ''} flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-2.5 rounded-lg ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <div className="vx-active-indicator" />
                                        <svg
                                            className="w-[18px] h-[18px] flex-shrink-0 transition-all duration-200"
                                            style={{
                                                color: active ? '#818cf8' : (hoveredItem === item.path ? '#94a3b8' : '#64748b'),
                                                filter: active ? 'drop-shadow(0 0 4px rgba(129,140,248,0.5))' : 'none'
                                            }}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d={item.icon} />
                                        </svg>
                                        {!isCollapsed && (
                                            <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
                                        )}
                                        {!isCollapsed && active && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"
                                                style={{ boxShadow: '0 0 6px rgba(129,140,248,0.8)' }} />
                                        )}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Modules */}
                    {enabledModules.length > 0 && (
                        <>
                            <div className="vx-sidebar-divider mb-3" />
                            <div className="mb-4">
                                {!isCollapsed && (
                                    <div className="px-4 mb-2">
                                        <span className="vx-section-label">MODULES</span>
                                    </div>
                                )}
                                {enabledModules.map((module) => {
                                    const link = moduleLinks[module];
                                    if (!link) return null;
                                    const active = isActive(link.path) || (module === 'inventory' && isInventoryActive);
                                    return (
                                        <div key={module}>
                                            <div className="vx-nav-item px-2 mb-0.5">
                                                <Link
                                                    to={link.path}
                                                    onMouseEnter={() => setHoveredItem(link.path)}
                                                    onMouseLeave={() => setHoveredItem(null)}
                                                    className={`vx-sidebar-item ${active ? 'is-active' : ''} flex items-center ${isCollapsed ? 'justify-center' : 'px-3 gap-3'} py-2.5 rounded-lg ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                                    title={isCollapsed ? link.label : ''}
                                                >
                                                    <div className="vx-active-indicator" />
                                                    {!isCollapsed ? (
                                                        <>
                                                            <div className="vx-module-icon-wrap"
                                                                style={{
                                                                    background: active ? `${link.color}18` : 'rgba(148,163,184,0.06)',
                                                                    border: `1px solid ${active ? `${link.color}30` : 'rgba(148,163,184,0.1)'}`
                                                                }}>
                                                                <svg className="w-3.5 h-3.5"
                                                                    style={{ color: active ? link.color : '#64748b' }}
                                                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                                                                </svg>
                                                            </div>
                                                            <span className="text-sm font-medium truncate">{link.label}</span>
                                                            {active && (
                                                                <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                    style={{ background: link.color, boxShadow: `0 0 6px ${link.color}` }} />
                                                            )}
                                                        </>
                                                    ) : (
                                                        <svg className="w-[18px] h-[18px]"
                                                            style={{ color: active ? link.color : '#64748b' }}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                                                        </svg>
                                                    )}
                                                </Link>
                                            </div>

                                            {/* Inventory sub-items */}
                                            {module === 'inventory' && !isCollapsed && (
                                                <div className="ml-8 space-y-0.5 mt-0.5">
                                                    {inventorySubItems.map((subItem, subIdx) => (
                                                        <Link
                                                            key={subIdx}
                                                            to={subItem.path}
                                                            className={`block px-3 py-1.5 text-xs rounded-lg transition-colors ${isActive(subItem.path) ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                                                        >
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Ask AI */}
                    <div className="px-2 mb-1">
                        <Link
                            to={`/dashboard/projects/${project_pk}/ai`}
                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2.5 rounded-lg transition-colors ${
                                isModuleActive(`/dashboard/projects/${project_pk}/ai`)
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                            title={isCollapsed ? 'Ask AI' : ''}
                        >
                            <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.3" />
                            </svg>
                            {!isCollapsed && <span className="text-sm font-medium">Ask AI</span>}
                        </Link>
                    </div>

                    {/* Project Settings */}
                    {isAdmin && !isCollapsed && (
                        <>
                            <div className="vx-sidebar-divider mb-2" />
                            <div className="px-2 mb-2">
                                <button
                                    onClick={onOpenSettings}
                                    className="vx-settings-btn flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-300"
                                >
                                    <svg className="vx-settings-icon w-[18px] h-[18px] flex-shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-sm font-medium">Project Settings</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                    <button
                        onClick={handleLogout}
                        className={`vx-logout-btn flex items-center ${isCollapsed ? 'justify-center' : 'px-3 gap-3'} py-2.5 rounded-lg text-slate-400 w-full`}
                        title={isCollapsed ? 'Logout' : ''}
                    >
                        <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-30 lg:hidden" onClick={onMobileClose} />
            )}
        </>
    );
};

export default ProjectSidebar;