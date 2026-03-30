import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const TopBar = ({ pageTitle, onMenuClick }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropdownRef = useRef(null);

    const getUserInitials = () => {
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return 'U';
    };

    const getUserName = () => {
        if (user?.email) return user.email.split('@')[0];
        return 'User';
    };

    const getRoleColor = () => {
        switch (user?.role) {
            case 'admin':   return { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', dot: '#8b5cf6' };
            case 'manager': return { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', dot: '#3b82f6' };
            case 'staff':   return { bg: 'rgba(16,185,129,0.1)', color: '#34d399', dot: '#10b981' };
            default:        return { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', dot: '#64748b' };
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 4);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };
    const roleConfig = getRoleColor();

    return (
        <>
            <style>{`
                @keyframes vx-topbar-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes vx-dropdown-in {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes vx-title-in {
                    from { opacity: 0; transform: translateX(-8px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes vx-avatar-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); }
                    50%       { box-shadow: 0 0 0 4px rgba(99,102,241,0); }
                }

                .vx-topbar {
                    animation: vx-topbar-in 0.4s cubic-bezier(0.4,0,0.2,1) both;
                    transition: box-shadow 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
                }
                .vx-topbar.is-scrolled {
                    box-shadow: 0 1px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
                }

                .vx-page-title {
                    animation: vx-title-in 0.4s 0.1s cubic-bezier(0.4,0,0.2,1) both;
                    position: relative;
                }
                .vx-page-title::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #3b82f6, #6366f1);
                    border-radius: 2px;
                    transition: width 0.4s ease;
                }

                .vx-hamburger {
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                }
                .vx-hamburger:hover {
                    background: rgba(99,102,241,0.07);
                    border-color: rgba(99,102,241,0.15);
                    color: #6366f1;
                }
                .vx-hamburger:active { transform: scale(0.95); }

                .vx-avatar-btn {
                    transition: all 0.22s ease;
                    border-radius: 10px;
                    padding: 4px;
                    border: 1px solid transparent;
                }
                .vx-avatar-btn:hover {
                    background: rgba(99,102,241,0.06);
                    border-color: rgba(99,102,241,0.12);
                }
                .vx-avatar-btn:hover .vx-avatar-ring {
                    animation: vx-avatar-pulse 1.5s ease-in-out infinite;
                }

                .vx-avatar-ring {
                    transition: box-shadow 0.22s ease;
                }

                .vx-chevron {
                    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
                }
                .vx-chevron.is-open { transform: rotate(180deg); }

                .vx-dropdown {
                    animation: vx-dropdown-in 0.2s cubic-bezier(0.34,1.3,0.64,1) both;
                    border: 1px solid rgba(226,232,240,0.8);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
                }

                .vx-dropdown-item {
                    transition: all 0.15s ease;
                    border-radius: 8px;
                    margin: 0 6px;
                }
                .vx-dropdown-item:hover {
                    background: rgba(99,102,241,0.06);
                    padding-left: 18px;
                }

                .vx-dropdown-logout {
                    transition: all 0.15s ease;
                    border-radius: 8px;
                    margin: 0 6px;
                    border: 1px solid transparent;
                }
                .vx-dropdown-logout:hover {
                    background: rgba(239,68,68,0.06);
                    border-color: rgba(239,68,68,0.15);
                    color: #ef4444;
                }

                .vx-breadcrumb-dot {
                    width: 4px; height: 4px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    display: inline-block;
                    margin: 0 2px;
                }
            `}</style>

            <header className={`vx-topbar ${scrolled ? 'is-scrolled' : ''} h-16 bg-white/95 backdrop-blur-sm border-b border-gray-100/80 fixed top-0 right-0 left-0 z-30`}>
                {/* Thin gradient accent at very top */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)',
                    opacity: scrolled ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }} />

                <div className="h-full px-4 flex items-center justify-between">

                    {/* Left */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={onMenuClick}
                            className="vx-hamburger p-2 rounded-lg text-gray-500 lg:hidden flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-2 min-w-0">
                            <span className="vx-breadcrumb-dot hidden sm:inline-block" />
                            <h1 className="vx-page-title text-lg font-semibold text-gray-800 truncate"
                                style={{ letterSpacing: '-0.015em' }}>
                                {pageTitle}
                            </h1>
                        </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 flex-shrink-0">

                        {/* User dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="vx-avatar-btn flex items-center gap-2.5"
                            >
                                {/* Avatar */}
                                <div className="vx-avatar-ring w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                    style={{ boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                                    {getUserInitials()}
                                </div>

                                {/* Name + role — hidden on small screens */}
                                <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                                    <span className="text-sm font-medium text-gray-700 leading-none">{getUserName()}</span>
                                    <span className="text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full"
                                        style={{ background: roleConfig.bg, color: roleConfig.color }}>
                                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                                    </span>
                                </div>

                                <svg className={`vx-chevron w-4 h-4 text-gray-400 ${showDropdown ? 'is-open' : ''}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showDropdown && (
                                <div className="vx-dropdown absolute right-0 mt-2 w-52 bg-white rounded-xl py-2 z-50">
                                    {/* User info header in dropdown */}
                                    <div className="px-4 py-2.5 mb-1" style={{ borderBottom: '1px solid rgba(226,232,240,0.7)' }}>
                                        <p className="text-sm font-semibold text-gray-800 truncate">{user?.email}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Signed in</p>
                                    </div>

                                    <Link
                                        to="/dashboard/profile"
                                        onClick={() => setShowDropdown(false)}
                                        className="vx-dropdown-item flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profile Settings
                                    </Link>

                                    <div className="my-1.5 mx-3" style={{ height: 1, background: 'rgba(226,232,240,0.7)' }} />

                                    <button
                                        onClick={handleLogout}
                                        className="vx-dropdown-logout flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-red-500"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default TopBar;