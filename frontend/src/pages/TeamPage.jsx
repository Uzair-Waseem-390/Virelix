import { useState, useEffect } from 'react';
import { getTeamMembers } from '../api/accounts';
import { getProjects, getProject } from '../api/projects';
import MembersTable from '../components/team/MembersTable';

const TeamPage = () => {
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);

            // Fetch team members
            const membersResponse = await getTeamMembers();
            console.log('Team members response:', membersResponse.data);

            // Fetch projects list
            const projectsResponse = await getProjects();
            console.log('Projects list response:', projectsResponse.data);

            // Handle projects data (could be array or single object)
            let projectsList = [];
            if (Array.isArray(projectsResponse.data)) {
                projectsList = projectsResponse.data;
            } else if (projectsResponse.data && typeof projectsResponse.data === 'object') {
                projectsList = [projectsResponse.data];
            }

            // Fetch full details for each project to get manager and staff info
            const fullProjects = await Promise.all(
                projectsList.map(async (project) => {
                    try {
                        const fullProject = await getProject(project.id);
                        console.log(`Full project ${project.id} details:`, fullProject.data);
                        return fullProject.data;
                    } catch (err) {
                        console.error(`Failed to fetch full project ${project.id}:`, err);
                        return project; // Return basic project if full fetch fails
                    }
                })
            );

            console.log('Full projects with member details:', fullProjects);
            setProjects(fullProjects);

            // Handle members data
            let membersData = [];
            if (Array.isArray(membersResponse.data)) {
                membersData = membersResponse.data;
            } else if (membersResponse.data && typeof membersResponse.data === 'object') {
                membersData = [membersResponse.data];
            }

            // Enrich members with project info using full project data
            const enrichedMembers = membersData.map(member => {
                // Find which project this member belongs to by checking manager_details and staff_details
                const project = fullProjects.find(p =>
                    p.manager_details?.id === member.id ||
                    p.staff_details?.id === member.id
                );

                console.log(`Member ${member.email} (${member.id}) belongs to project:`, project?.name || 'None');

                return {
                    ...member,
                    project_name: project ? project.name : '—',
                    project_id: project ? project.id : null
                };
            });

            console.log('Enriched members:', enrichedMembers);
            setMembers(enrichedMembers);

        } catch (err) {
            console.error('Failed to fetch team data:', err);
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
                                {[1, 2, 3, 4].map((i) => (
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
                        <button
                            onClick={fetchTeamData}
                            className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                            Retry
                        </button>
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