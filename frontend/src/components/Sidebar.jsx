import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', adminOnly: false },
        { path: '/dashboard/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', adminOnly: false },
    ];

    if (user?.role === 'admin') {
        navItems.push({ path: '/dashboard/team', label: 'Team Members', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true });
    }

    return (
        <div className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0">
            <div className="p-6">
                <div className="flex items-center space-x-2 mb-8">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold">Virelix</span>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <button
                        onClick={() => {
                            logout();
                            window.location.href = '/login';
                        }}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white w-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;