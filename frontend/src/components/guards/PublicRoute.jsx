import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const PublicRoute = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (isAuthenticated && user?.redirect_to) {
        // Clean the redirect path
        let redirectPath = user.redirect_to;
        if (redirectPath.startsWith('//')) {
            redirectPath = redirectPath.substring(1);
        }
        redirectPath = redirectPath.replace(/\/+/g, '/');
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;