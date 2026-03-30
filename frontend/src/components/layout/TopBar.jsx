import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const TopBar = ({ pageTitle, notificationCount = 0, onMenuClick }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const getUserInitials = () => {
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return 'U';
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-0 z-30">
            <div className="h-full px-4 flex items-center justify-between">
                {/* Left - Menu button + Page title */}
                <div className="flex items-center gap-4 min-w-0">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden flex-shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 truncate">{pageTitle}</h1>
                </div>

                {/* Right - Notifications + User */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Notifications */}
                    <button className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notificationCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                                {notificationCount > 9 ? '9+' : notificationCount}
                            </span>
                        )}
                    </button>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                {getUserInitials()}
                            </div>
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <Link
                                    to="/dashboard/profile"
                                    onClick={() => setShowDropdown(false)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Profile Settings
                                </Link>
                                <hr className="my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;