import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChat, sendMessage, deleteChat } from '../api/agent';
import DeleteChatModal from '../components/ai/DeleteChatModal';

// Simple markdown-like renderer for AI responses
const MessageContent = ({ content }) => {
    // Convert basic markdown: **bold**, bullet lists, newlines
    const lines = content.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (line.startsWith('  • ') || line.startsWith('• ')) {
                    const text = line.replace(/^(\s*•\s*)/, '');
                    return (
                        <div key={i} className="flex gap-2">
                            <span className="text-current opacity-60 flex-shrink-0">•</span>
                            <span>{renderInline(text)}</span>
                        </div>
                    );
                }
                if (line.trim() === '') return <div key={i} className="h-2" />;
                return <p key={i}>{renderInline(line)}</p>;
            })}
        </div>
    );
};

const renderInline = (text) => {
    // Bold: **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const AIChatPage = () => {
    const { project_pk, chatId } = useParams();
    const navigate = useNavigate();

    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        fetchChat();
    }, [chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending]);

    const fetchChat = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getChat(project_pk, chatId);
            setChat(res.data);
            setMessages(res.data.messages || []);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to load chat.');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setInput('');
        setSending(true);
        setError('');

        // Optimistic user message — shown immediately while waiting
        const tempUserMsg = { id: `temp-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const res = await sendMessage(project_pk, chatId, text);
            const { user_message, assistant_message } = res.data;

            // Replace temp with confirmed messages from the server
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempUserMsg.id),
                user_message,
                assistant_message,
            ]);

            // Update chat title after first message
            if (chat?.title === 'New Chat') {
                setChat(prev => ({ ...prev, title: user_message.content.slice(0, 60) }));
            }
        } catch (err) {
            // ── Timeout / broken-pipe recovery ───────────────────────────────
            // The backend saves both messages even if the HTTP connection drops.
            // Detect a client-side timeout (code=ECONNABORTED) or a network
            // error (no response received) and try to recover automatically.
            const isTimeoutOrNetwork =
                err.code === 'ECONNABORTED' ||          // axios timeout
                err.code === 'ERR_NETWORK' ||           // no response at all
                !err.response;                          // any other connection loss

            if (isTimeoutOrNetwork) {
                // Keep the optimistic user message visible and show a soft notice
                setError('The AI is taking longer than expected. Fetching response...');

                // Wait briefly then reload the full chat — the backend will
                // have saved both the user message and the AI reply by now.
                setTimeout(async () => {
                    try {
                        const recovery = await getChat(project_pk, chatId);
                        setMessages(recovery.data.messages || []);
                        setChat(recovery.data);
                        setError('');    // clear the temporary notice
                    } catch {
                        // Recovery also failed — keep the error visible
                        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
                        setError('Could not fetch AI response. Please refresh the page.');
                    }
                }, 1500);
            } else {
                // For real server errors (4xx / 5xx) remove the optimistic
                // message and show the backend's error detail.
                setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
                setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
            }
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteChat(project_pk, chatId);
            navigate(`/dashboard/projects/${project_pk}/ai`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to delete chat.');
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const formatTime = (iso) => {
        return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex flex-col h-[calc(100vh-64px)]">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-3 text-gray-500 text-sm">Loading chat...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !chat) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => navigate(`/dashboard/projects/${project_pk}/ai`)}
                        className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                        Back to Chats
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Top bar */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(`/dashboard/projects/${project_pk}/ai`)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Back to chats"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.3" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{chat?.title || 'New Chat'}</p>
                        <p className="text-xs text-gray-400">Business Analyst</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete chat"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length === 0 && !sending && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h3 className="text-gray-700 font-medium mb-1">Ask your Business Analyst</h3>
                            <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                Ask about sales trends, product performance, inventory health, and more.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                {[
                                    'Show me last 3 months sales',
                                    'Which products are low on stock?',
                                    'What is my total revenue this month?',
                                ].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.3" />
                                    </svg>
                                </div>
                            )}
                            <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                <div
                                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                                    }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <MessageContent content={msg.content} />
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                                <p className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {formatTime(msg.created_at)}
                                </p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {sending && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.414 2.798H4.213c-1.444 0-2.414-1.798-1.414-2.798L4 15.3" />
                                </svg>
                            </div>
                            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                                <div className="flex gap-1 items-center h-4">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-100">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
            )}

            {/* Input area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4">
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your business data... (Enter to send, Shift+Enter for new line)"
                        rows={1}
                        disabled={sending}
                        className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 max-h-32 overflow-y-auto"
                        style={{ minHeight: '48px' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="flex-shrink-0 w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Send message"
                    >
                        {sending ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                    AI responses are based on your live project data.
                </p>
            </div>

            <DeleteChatModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                isLoading={deleting}
                chatTitle={chat?.title}
            />
        </div>
    );
};

export default AIChatPage;
