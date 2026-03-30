import { useState } from 'react';
import { activateMember, deactivateMember } from '../../api/accounts';
import EditMemberModal from './EditMemberModal';
import SetPasswordModal from './SetPasswordModal';

const MembersTable = ({ members, projects, onMemberUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [passwordMember, setPasswordMember] = useState(null);
    const [loadingStates, setLoadingStates] = useState({});

    const getProjectForMember = (memberId) => {
        // Find project where this member is manager or staff
        const project = projects?.find(p =>
            p.manager_details?.id === memberId ||
            p.staff_details?.id === memberId
        );
        return project?.name || '—';
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'manager': return 'bg-blue-100 text-blue-800';
            case 'staff': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleToggleStatus = async (member) => {
        setLoadingStates(prev => ({ ...prev, [member.id]: true }));

        try {
            if (member.is_active) {
                await deactivateMember(member.id);
            } else {
                await activateMember(member.id);
            }
            onMemberUpdate({ ...member, is_active: !member.is_active });
        } catch (err) {
            console.error('Failed to toggle status:', err);
            alert(err.response?.data?.detail || 'Failed to update status');
        } finally {
            setLoadingStates(prev => ({ ...prev, [member.id]: false }));
        }
    };

    const filteredMembers = members.filter(member =>
        member.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (members.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No team members yet</h3>
                <p className="text-gray-500">Team members will appear here once projects are created</p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                            {filteredMembers.length} / {members.length}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMembers.map((member, index) => {
                                const projectName = member.project_name || getProjectForMember(member.id);
                                return (
                                    <tr key={member.id} className="hover:bg-gray-50 transition-colors" style={{ animation: `fadeIn 0.3s ease-out ${index * 0.05}s forwards`, opacity: 0 }}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{member.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                                                {member.role?.charAt(0).toUpperCase() + member.role?.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {projectName !== '—' ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                        {projectName}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleToggleStatus(member)}
                                                disabled={loadingStates[member.id]}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${member.is_active ? 'bg-green-600' : 'bg-gray-200'
                                                    }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${member.is_active ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingMember(member)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50"
                                                    title="Edit Email"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setPasswordMember(member)}
                                                    className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded hover:bg-gray-100"
                                                    title="Set Password"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && searchTerm && (
                    <div className="p-6 text-center text-gray-500 border-t border-gray-200">
                        No team members found matching "{searchTerm}"
                    </div>
                )}
            </div>

            <EditMemberModal
                isOpen={!!editingMember}
                onClose={() => setEditingMember(null)}
                member={editingMember}
                onUpdate={(updatedMember) => {
                    onMemberUpdate(updatedMember);
                    setEditingMember(null);
                }}
            />

            <SetPasswordModal
                isOpen={!!passwordMember}
                onClose={() => setPasswordMember(null)}
                member={passwordMember}
                onSuccess={() => {
                    console.log('Password updated successfully');
                }}
            />

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </>
    );
};

export default MembersTable;