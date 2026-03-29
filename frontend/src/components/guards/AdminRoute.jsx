import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const AdminRoute = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== 'admin') {
        return <Navigate to={user?.redirect_to || '/dashboard/'} replace />;
    }

    return <Outlet />;
};

export default AdminRoute;