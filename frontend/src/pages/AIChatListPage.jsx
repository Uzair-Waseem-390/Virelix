import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listChats, createChat, deleteChat } from '../api/agent';
import DeleteChatModal from '../components/ai/DeleteChatModal';

const AIChatListPage = () => {
    const { project_pk } = useParams();
    const navigate = useNavigate();

    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }
    const [error, setError] = useState('');

    useEffect(() => {
        fetchChats();
    }, [project_pk]);

    const fetchChats = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await listChats(project_pk);
            setChats(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load chats.');
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = async () => {
        setCreating(true);
        try {
            const res = await createChat(project_pk);
            navigate(`/dashboard/projects/${project_pk}/ai/chats/${res.data.id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create chat.');
            setCreating(false);
        }
    };

    const handleDelete = async (e, chatId) => {
        e.stopPropagation();
        const chat = chats.find(c => c.id === chatId);
        setConfirmDelete({ id: chatId, title: chat?.title || 'this chat' });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDelete) return;
        setDeletingId(confirmDelete.id);
        try {
            await deleteChat(project_pk, confirmDelete.id);
            setChats(prev => prev.filter(c => c.id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete chat.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (iso) => {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">AI Business Analyst</h1>
                    <p className="text-gray-500 mt-1">Ask questions about your sales, products, and inventory.</p>
                </div>
                <button
                    onClick={handleNewChat}
                    disabled={creating}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-60"
                >
                    {creating ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                    New Chat
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            ) : chats.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No chats yet</h3>
                    <p className="text-gray-500 mb-6 text-sm">Start a conversation with your AI Business Analyst.</p>
                    <button
                        onClick={handleNewChat}
                        disabled={creating}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                        Start First Chat
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => navigate(`/dashboard/projects/${project_pk}/ai/chats/${chat.id}`)}
                            className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-200 border border-transparent transition-all duration-150 group"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{chat.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {chat.message_count} message{chat.message_count !== 1 ? 's' : ''} · {formatDate(chat.updated_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, chat.id)}
                                disabled={deletingId === chat.id}
                                className="ml-4 p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                title="Delete chat"
                            >
                                {deletingId === chat.id ? (
                                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block"></span>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <DeleteChatModal
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={!!deletingId}
                chatTitle={confirmDelete?.title}
            />
        </div>
    );
};

export default AIChatListPage;
