import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AdminProjectRedirect = () => {
    const navigate = useNavigate();
    const { project_pk } = useParams();

    useEffect(() => {
        navigate(`/dashboard/projects/${project_pk}`, { replace: true });
    }, [navigate, project_pk]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Redirecting to project...</p>
            </div>
        </div>
    );
};

export default AdminProjectRedirect;