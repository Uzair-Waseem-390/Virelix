import { useState, useEffect, useCallback } from 'react';
import {
    verifyPassword, listUsers, listProjects,
    listMembers, generateData, getHistory,
} from '../api/dataEntry';

// ── tiny helpers ──────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().split('T')[0];

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const StatusBadge = ({ status }) => {
    const map = {
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        success: 'bg-green-100  text-green-700  border-green-200',
        failed:  'bg-red-100   text-red-700    border-red-200',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            {status}
        </span>
    );
};

const Spinner = ({ size = 'md' }) => {
    const s = size === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-3';
    return <span className={`${s} border-blue-600 border-t-transparent rounded-full animate-spin inline-block`} />;
};

const Field = ({ label, hint, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {hint && <span className="ml-1.5 text-xs text-slate-400 font-normal">{hint}</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const inputCls = (err) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
        err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`;

const selectCls = (err) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 appearance-none bg-white ${
        err ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'
    }`;

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Select User', 'Select Project', 'Select Member', 'Configure & Run'];

const StepBar = ({ current }) => (
    <div className="flex items-center gap-0 mb-10">
        {STEPS.map((label, i) => {
            const done    = i < current;
            const active  = i === current;
            const last    = i === STEPS.length - 1;
            return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            done   ? 'bg-blue-600 border-blue-600 text-white' :
                            active ? 'bg-white border-blue-600 text-blue-600' :
                                     'bg-white border-slate-200 text-slate-400'
                        }`}>
                            {done ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : i + 1}
                        </div>
                        <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-slate-500' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </div>
                    {!last && (
                        <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${done ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    )}
                </div>
            );
        })}
    </div>
);

// ── Password gate ─────────────────────────────────────────────────────────────

const PasswordGate = ({ onSuccess }) => {
    const [pwd, setPwd]       = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');
    const [show, setShow]     = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pwd.trim()) { setError('Password is required.'); return; }
        setLoading(true);
        setError('');
        try {
            await verifyPassword(pwd.trim());
            localStorage.setItem('de_password', pwd.trim());
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm4 0h8M8 12h8M8 16h5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Data Entry Tool</h1>
                    <p className="text-slate-400 text-sm mt-1">Developer access only</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Access Password</label>
                        <div className="relative">
                            <input
                                type={show ? 'text' : 'password'}
                                value={pwd}
                                onChange={(e) => { setPwd(e.target.value); setError(''); }}
                                placeholder="Enter developer password"
                                autoFocus
                                className={`w-full px-4 py-3 pr-11 rounded-xl bg-white/10 border text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${
                                    error ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShow(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                {show ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? <><Spinner size="sm" /> Verifying...</> : 'Unlock Tool'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ── History panel ─────────────────────────────────────────────────────────────

const HistoryPanel = ({ projectId }) => {
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const load = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const res = await getHistory(projectId);
            setRows(res.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { load(); }, [load]);

    if (!projectId) return null;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generation History
                </h3>
                <button onClick={load} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    {loading ? <Spinner size="sm" /> : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                    Refresh
                </button>
            </div>

            {loading && rows.length === 0 ? (
                <div className="flex justify-center py-8"><Spinner /></div>
            ) : rows.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-100">
                    No history for this project yet.
                </div>
            ) : (
                <div className="space-y-2">
                    {rows.map((row) => (
                        <div key={row.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                            <button
                                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <StatusBadge status={row.status} />
                                    <span className="text-sm text-slate-600 truncate">
                                        {row.user_email || '—'}
                                    </span>
                                    <span className="text-xs text-slate-400">{fmtDate(row.created_at)}</span>
                                </div>
                                <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded === row.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {expanded === row.id && (
                                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                        {Object.entries(row.parameters).map(([k, v]) => (
                                            <div key={k} className="bg-white rounded-lg p-2.5 border border-slate-100">
                                                <p className="text-xs text-slate-400 capitalize">{k.replace(/_/g, ' ')}</p>
                                                <p className="text-sm font-semibold text-slate-700 mt-0.5">{String(v)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {row.error_message && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                                            {row.error_message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main tool ─────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
    start_date:      today(),
    duration_days:   30,
    customers_count: 50,
    products_count:  10,
    orders_per_day:  5,
};

const DataEntryTool = ({ onLogout }) => {
    // wizard state
    const [step, setStep]               = useState(0);
    const [users, setUsers]             = useState([]);
    const [projects, setProjects]       = useState([]);
    const [members, setMembers]         = useState([]);
    const [selectedUser, setSelectedUser]       = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedMember, setSelectedMember]   = useState(null);

    // form
    const [form, setForm]   = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);

    // async
    const [loading, setLoading]   = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult]     = useState(null); // { success, history_id } | { error }
    const [apiError, setApiError] = useState('');

    // ── load users on mount ───────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        listUsers()
            .then(r => setUsers(r.data))
            .catch(() => setApiError('Failed to load users.'))
            .finally(() => setLoading(false));
    }, []);

    // ── step handlers ─────────────────────────────────────────────────────────
    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setSelectedProject(null);
        setSelectedMember(null);
        setResult(null);
        setApiError('');
        setLoading(true);
        try {
            const r = await listProjects(user.id);
            setProjects(r.data);
            setStep(1);
        } catch {
            setApiError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = async (project) => {
        setSelectedProject(project);
        setSelectedMember(null);
        setResult(null);
        setApiError('');
        setLoading(true);
        try {
            const r = await listMembers(project.id);
            setMembers(r.data);
            setStep(2);
        } catch {
            setApiError('Failed to load project members.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMember = (member) => {
        setSelectedMember(member);
        setResult(null);
        setApiError('');
        setStep(3);
    };

    const goBack = () => {
        setApiError('');
        setResult(null);
        if (step === 3) { setStep(2); setSelectedMember(null); }
        else if (step === 2) { setStep(1); setSelectedProject(null); setMembers([]); }
        else if (step === 1) { setStep(0); setSelectedUser(null); setProjects([]); }
    };

    // ── form validation ───────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        const { start_date, duration_days, customers_count, products_count, orders_per_day } = form;

        if (!start_date) {
            e.start_date = 'Start date is required.';
        } else {
            const d = new Date(start_date);
            if (isNaN(d.getTime())) e.start_date = 'Invalid date.';
        }

        if (!duration_days || duration_days < 1 || duration_days > 3650)
            e.duration_days = 'Must be between 1 and 3650 days.';

        if (customers_count < 0 || customers_count > 10000)
            e.customers_count = 'Must be between 0 and 10,000.';

        if (!products_count || products_count < 1 || products_count > 500)
            e.products_count = 'Must be between 1 and 500.';

        if (!orders_per_day || orders_per_day < 1 || orders_per_day > 1000)
            e.orders_per_day = 'Must be between 1 and 1,000.';

        if (!confirmPwd.trim())
            e.confirmPwd = 'Please enter the password to confirm generation.';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleFormChange = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };

    // ── submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        setApiError('');
        setResult(null);

        // Step 1: verify the password before doing anything
        try {
            await verifyPassword(confirmPwd.trim());
        } catch {
            setErrors(prev => ({ ...prev, confirmPwd: 'Incorrect password. Please try again.' }));
            setSubmitting(false);
            return;
        }

        // Step 2: password is correct — generate data
        try {
            const res = await generateData({
                project_id:      selectedProject.id,
                user_id:         selectedMember.id,
                start_date:      form.start_date,
                duration_days:   Number(form.duration_days),
                customers_count: Number(form.customers_count),
                products_count:  Number(form.products_count),
                orders_per_day:  Number(form.orders_per_day),
                password:        confirmPwd.trim(),
            });
            setResult({ success: true, history_id: res.data.history_id });
            setConfirmPwd('');
        } catch (err) {
            const detail = err.response?.data?.detail;
            const fieldErrors = err.response?.data;
            if (typeof fieldErrors === 'object' && !detail) {
                setApiError(Object.values(fieldErrors).flat().join(' '));
            } else {
                setApiError(detail || 'Generation failed. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Top bar */}
            <div className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm4 0h8M8 12h8M8 16h5" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900">Data Entry Tool</h1>
                            <p className="text-xs text-slate-400">Developer utility · Internal use only</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            Authenticated
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all"
                            title="Clear saved password and lock tool"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Lock
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <StepBar current={step} />

                {apiError && (
                    <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {apiError}
                    </div>
                )}

                {/* ── STEP 0: Select User ── */}
                {step === 0 && (
                    <div className="animate-fade-in">
                        <SectionHeader
                            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            title="Select Admin User"
                            subtitle="Choose the admin user whose projects you want to populate with data."
                        />
                        {loading ? (
                            <div className="flex justify-center py-16"><Spinner /></div>
                        ) : users.length === 0 ? (
                            <EmptyState message="No admin users found." />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {users.map(u => (
                                    <SelectCard
                                        key={u.id}
                                        onClick={() => handleSelectUser(u)}
                                        icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        title={u.email}
                                        badge={u.role}
                                        badgeColor="blue"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 1: Select Project ── */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <BackButton onClick={goBack} />
                        <SectionHeader
                            icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            title="Select Project"
                            subtitle={`Projects belonging to ${selectedUser?.email}`}
                        />
                        {loading ? (
                            <div className="flex justify-center py-16"><Spinner /></div>
                        ) : projects.length === 0 ? (
                            <EmptyState message="No projects found for this user." />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {projects.map(p => (
                                    <SelectCard
                                        key={p.id}
                                        onClick={() => handleSelectProject(p)}
                                        icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                        title={p.name}
                                        subtitle={p.description || 'No description'}
                                        badgeColor="indigo"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 2: Select Member ── */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <BackButton onClick={goBack} />
                        <SectionHeader
                            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            title="Select Project Member"
                            subtitle={`Who will be the author of the generated data in "${selectedProject?.name}"?`}
                        />
                        {loading ? (
                            <div className="flex justify-center py-16"><Spinner /></div>
                        ) : members.length === 0 ? (
                            <EmptyState message="No members found for this project." />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {members.map(m => (
                                    <SelectCard
                                        key={m.id}
                                        onClick={() => handleSelectMember(m)}
                                        icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        title={m.email}
                                        badge={m.role}
                                        badgeColor={m.role === 'admin' ? 'purple' : m.role === 'manager' ? 'blue' : 'gray'}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP 3: Configure & Run ── */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <BackButton onClick={goBack} />

                        {/* Summary strip */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <Chip icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={selectedUser?.email} />
                            <span className="text-slate-300 self-center">›</span>
                            <Chip icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" label={selectedProject?.name} />
                            <span className="text-slate-300 self-center">›</span>
                            <Chip icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" label={`${selectedMember?.email} (${selectedMember?.role})`} />
                        </div>

                        {result?.success ? (
                            <SuccessCard historyId={result.history_id} onReset={() => { setResult(null); setForm(INITIAL_FORM); }} />
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                    </svg>
                                    Generation Parameters
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Field label="Start Date" error={errors.start_date}>
                                        <input
                                            type="date"
                                            value={form.start_date}
                                            max={today()}
                                            onChange={e => handleFormChange('start_date', e.target.value)}
                                            className={inputCls(errors.start_date)}
                                        />
                                    </Field>

                                    <Field label="Duration" hint="(days, 1–3650)" error={errors.duration_days}>
                                        <input
                                            type="number"
                                            value={form.duration_days}
                                            min={1} max={3650}
                                            onChange={e => handleFormChange('duration_days', e.target.value)}
                                            className={inputCls(errors.duration_days)}
                                        />
                                    </Field>

                                    <Field label="Customers Count" hint="(0–10,000)" error={errors.customers_count}>
                                        <input
                                            type="number"
                                            value={form.customers_count}
                                            min={0} max={10000}
                                            onChange={e => handleFormChange('customers_count', e.target.value)}
                                            className={inputCls(errors.customers_count)}
                                        />
                                    </Field>

                                    <Field label="Products Count" hint="(1–500)" error={errors.products_count}>
                                        <input
                                            type="number"
                                            value={form.products_count}
                                            min={1} max={500}
                                            onChange={e => handleFormChange('products_count', e.target.value)}
                                            className={inputCls(errors.products_count)}
                                        />
                                    </Field>

                                    <Field label="Orders Per Day" hint="(1–1,000)" error={errors.orders_per_day}>
                                        <input
                                            type="number"
                                            value={form.orders_per_day}
                                            min={1} max={1000}
                                            onChange={e => handleFormChange('orders_per_day', e.target.value)}
                                            className={inputCls(errors.orders_per_day)}
                                        />
                                    </Field>

                                    {/* Estimated rows preview */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-center">
                                        <p className="text-xs text-slate-400 mb-1">Estimated records</p>
                                        <p className="text-2xl font-bold text-slate-800">
                                            ~{(Number(form.orders_per_day || 0) * Number(form.duration_days || 0)).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">sales orders</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-5 border-t border-slate-100">
                                    {/* Password confirmation before generate */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Confirm Password
                                            <span className="ml-1.5 text-xs text-slate-400 font-normal">
                                                (re-enter to confirm generation)
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPwd ? 'text' : 'password'}
                                                value={confirmPwd}
                                                onChange={e => {
                                                    setConfirmPwd(e.target.value);
                                                    if (errors.confirmPwd) setErrors(prev => ({ ...prev, confirmPwd: '' }));
                                                }}
                                                placeholder="Enter your access password to proceed"
                                                className={`${inputCls(errors.confirmPwd)} pr-10`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPwd(s => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showConfirmPwd ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {errors.confirmPwd && (
                                            <p className="mt-1 text-xs text-red-500">{errors.confirmPwd}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-60"
                                        >
                                            {submitting ? (
                                                <><Spinner size="sm" /> Generating...</>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    Generate Data
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <HistoryPanel projectId={selectedProject?.id} />
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Small reusable sub-components ─────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        {subtitle && <p className="text-sm text-slate-500 ml-11">{subtitle}</p>}
    </div>
);

const BackButton = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors group"
    >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
    </button>
);

const BADGE_COLORS = {
    blue:   'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    purple: 'bg-purple-100 text-purple-700',
    gray:   'bg-slate-100 text-slate-600',
};

const SelectCard = ({ onClick, icon, title, subtitle, badge, badgeColor = 'gray' }) => (
    <button
        onClick={onClick}
        className="group text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-md transition-all duration-150 flex items-start gap-3"
    >
        <div className="w-9 h-9 bg-slate-50 group-hover:bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
            </svg>
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{title}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            {badge && (
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BADGE_COLORS[badgeColor]}`}>
                    {badge}
                </span>
            )}
        </div>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    </button>
);

const Chip = ({ icon, label }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
        <span className="max-w-[180px] truncate">{label}</span>
    </span>
);

const EmptyState = ({ message }) => (
    <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
        <svg className="w-10 h-10 mx-auto mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        {message}
    </div>
);

const SuccessCard = ({ historyId, onReset }) => (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h3 className="text-base font-bold text-green-800 mb-1">Generation Started!</h3>
        <p className="text-sm text-green-600 mb-1">
            Task dispatched successfully. History ID: <strong>#{historyId}</strong>
        </p>
        <p className="text-xs text-green-500 mb-5">
            The Celery worker is generating data in the background. Check the history below for status updates.
        </p>
        <button
            onClick={onReset}
            className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        >
            Generate More Data
        </button>
    </div>
);

// ── Root export ───────────────────────────────────────────────────────────────

const DataEntryPage = () => {
    const [authenticated, setAuthenticated] = useState(
        () => !!localStorage.getItem('de_password')
    );

    const handleLogout = () => {
        localStorage.removeItem('de_password');
        setAuthenticated(false);
    };

    if (!authenticated) {
        return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
    }

    return <DataEntryTool onLogout={handleLogout} />;
};

export default DataEntryPage;
