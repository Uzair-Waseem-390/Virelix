import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import CreateProjectModal from '../projects/CreateProjectModal';

const AdminSidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { adminDashboardData, logout } = useAuthStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        if (path === '/dashboard/projects') return location.pathname === '/dashboard/projects';
        if (path === '/dashboard/team') return location.pathname === '/dashboard/team';
        if (path === '/dashboard/profile') return location.pathname === '/dashboard/profile';
        if (path.startsWith('/dashboard/projects/') && path.includes('/enter')) return false;
        return location.pathname.startsWith(path + '/');
    };

    const handleLogout = () => { logout(); navigate('/login'); };

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
            <style>{`
                @keyframes vx-slide-in {
                    from { opacity: 0; transform: translateX(-12px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes vx-fade-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes vx-glow-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
                    50%       { box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
                }
                @keyframes vx-shimmer-move {
                    0%   { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(220%) skewX(-12deg); }
                }
                @keyframes vx-dot-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.5; transform: scale(0.7); }
                }
                @keyframes vx-logo-enter {
                    from { opacity: 0; transform: scale(0.8) rotate(-10deg); }
                    to   { opacity: 1; transform: scale(1) rotate(0deg); }
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

                /* Shimmer sweep on hover */
                .vx-sidebar-item::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 40%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
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
                    color: rgba(148,163,184,0.5);
                    transition: color 0.2s;
                }

                .vx-logo-icon {
                    animation: vx-logo-enter 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
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

                .vx-project-dot {
                    animation: vx-dot-pulse 2.4s ease-in-out infinite;
                }

                .vx-new-project-btn {
                    background: transparent;
                    border: 1px dashed rgba(99,102,241,0.25);
                    transition: all 0.25s ease;
                }
                .vx-new-project-btn:hover {
                    border-color: rgba(99,102,241,0.6);
                    background: rgba(99,102,241,0.07);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99,102,241,0.12);
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

                .vx-toggle-btn {
                    transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
                }
                .vx-toggle-btn:hover {
                    background: rgba(99,102,241,0.15);
                    color: #a5b4fc;
                }

                .vx-sidebar-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(148,163,184,0.12), transparent);
                    margin: 0 16px;
                }
            `}</style>

            <aside
                className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 overflow-hidden fixed inset-y-0 left-0 ${isMobileOpen ? 'z-50' : 'hidden lg:flex z-20'} ${isCollapsed ? 'w-16' : 'w-64'}`}
                style={{ borderRight: '1px solid rgba(148,163,184,0.07)' }}
            >
                {/* Subtle top accent line */}
                <div style={{ height: 2, background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)', flexShrink: 0 }} />

                {/* Logo */}
                <div className={`h-16 flex-shrink-0 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} border-b border-slate-700/60`}
                    style={{ borderBottomColor: 'rgba(148,163,184,0.08)' }}>
                    {!isCollapsed ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="vx-logo-icon w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/40"
                                    style={{ animation: 'vx-glow-pulse 3s ease-in-out infinite' }}>
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                    </svg>
                                </div>
                                <span className="text-white font-bold tracking-tight truncate" style={{ fontSize: 15 }}>Virelix</span>
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

                {/* Scrollable nav */}
                <div className={`flex-1 overflow-y-auto overflow-x-hidden py-3 ${mounted ? 'vx-nav-mounted' : ''}`}
                    style={{ scrollbarWidth: 'none' }}>

                    {navSections.map((section, idx) => (
                        <div key={idx} className="mb-5">
                            {!isCollapsed && (
                                <div className="px-4 mb-2">
                                    <span className="vx-section-label">{section.title}</span>
                                </div>
                            )}
                            {section.items.map((item, itemIdx) => {
                                const active = isActive(item.path);
                                return (
                                    <div key={itemIdx} className="vx-nav-item px-2 mb-0.5">
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
                                                <span className="ml-3 text-sm font-medium truncate"
                                                    style={{ color: active ? '#e2e8f0' : undefined }}>
                                                    {item.label}
                                                </span>
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
                    ))}

                    {/* MY PROJECTS */}
                    {projects.length > 0 && (
                        <>
                            <div className="vx-sidebar-divider mb-4" />
                            <div className="mb-4">
                                {!isCollapsed && (
                                    <div className="px-4 mb-2">
                                        <span className="vx-section-label">MY PROJECTS</span>
                                    </div>
                                )}
                                {projects.map((project, pIdx) => (
                                    <div key={project.id} className="vx-nav-item px-2 mb-0.5">
                                        <Link
                                            to={`/dashboard/projects/${project.id}/enter`}
                                            className="vx-sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white"
                                            title={isCollapsed ? project.name : ''}
                                        >
                                            {isCollapsed ? (
                                                <div className="vx-project-dot w-2 h-2 rounded-full bg-green-400 flex-shrink-0"
                                                    style={{ animationDelay: `${pIdx * 0.4}s` }} />
                                            ) : (
                                                <>
                                                    <div className="vx-project-dot w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
                                                        style={{ animationDelay: `${pIdx * 0.4}s`, boxShadow: '0 0 5px rgba(52,211,153,0.5)' }} />
                                                    <span className="text-sm truncate">{project.name}</span>
                                                </>
                                            )}
                                        </Link>
                                    </div>
                                ))}

                                <div className="px-2 mt-1">
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className={`vx-new-project-btn flex items-center ${isCollapsed ? 'justify-center' : 'px-3 gap-2.5'} py-2 rounded-lg w-full text-slate-400`}
                                        title={isCollapsed ? 'New Project' : ''}
                                    >
                                        <svg className="w-4 h-4 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        {!isCollapsed && <span className="text-sm text-indigo-400 font-medium">New Project</span>}
                                    </button>
                                </div>
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

            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onProjectCreated={() => { setShowCreateModal(false); window.location.reload(); }}
            />
        </>
    );
};

export default AdminSidebar;