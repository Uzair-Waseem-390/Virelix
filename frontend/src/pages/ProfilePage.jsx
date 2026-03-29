import { useState, useEffect } from 'react';
import { getMyFullProfile } from '../api/accounts';
import ProfileCard from '../components/profile/ProfileCard';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import DangerZone from '../components/profile/DangerZone';
import { useAuthStore } from '../store/authStore';

const ProfilePage = () => {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await getMyFullProfile();
            setProfile(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                        <div className="grid lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                                <div className="space-y-3">
                                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                                    <div className="h-10 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <ProfileCard profile={profile} onProfileUpdate={setProfile} />
                    <ChangePasswordForm />
                </div>

                {user?.role === 'admin' && (
                    <div className="mt-6">
                        <DangerZone />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;