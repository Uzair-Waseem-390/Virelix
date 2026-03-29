import { useState, useEffect } from 'react';
import { getTeamMembers } from '../api/accounts';
import MembersTable from '../components/team/MembersTable';

const TeamPage = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch projects from Zustand or API (assuming projects are stored)
    const projects = []; // This should come from your project store/API

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const response = await getTeamMembers();
            setMembers(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load team members');
        } finally {
            setLoading(false);
        }
    };

    const handleMemberUpdate = (updatedMember) => {
        setMembers(prev => prev.map(m =>
            m.id === updatedMember.id ? updatedMember : m
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                            <div className="p-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="mb-4">
                                        <div className="h-16 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
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
                    <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
                    <p className="text-gray-600 mt-2">Manage your project team members</p>
                </div>

                <MembersTable
                    members={members}
                    projects={projects}
                    onMemberUpdate={handleMemberUpdate}
                />
            </div>
        </div>
    );
};

export default TeamPage;