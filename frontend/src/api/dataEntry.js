import axios from 'axios';

const BASE = 'http://127.0.0.1:8000/data_entry';

// ── Clean instance — NO interceptor, used only for password verification ──────
// This ensures the typed password is the ONLY credential sent.
// The interceptor on `de` would inject the stored password from localStorage
// and override whatever the user typed, making wrong passwords appear valid.
const deClean = axios.create({
    baseURL: BASE,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Main instance — injects stored password on every request ──────────────────
const de = axios.create({
    baseURL: BASE,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
});

de.interceptors.request.use((config) => {
    const pwd = localStorage.getItem('de_password');
    if (pwd) {
        config.headers['X-DataEntry-Password'] = pwd;
        if (config.method === 'get') {
            config.params = { ...config.params, password: pwd };
        }
    }
    return config;
});

// ── API calls ─────────────────────────────────────────────────────────────────

// Uses deClean — only the typed password is sent, no stored header injection
export const verifyPassword = (password) =>
    deClean.post('/verify-password/', { password });

export const listUsers = () =>
    de.get('/users/');

export const listProjects = (userId) =>
    de.get('/projects/', { params: { user_id: userId } });

export const listMembers = (projectId) =>
    de.get('/project-members/', { params: { project_id: projectId } });

export const generateData = (payload) =>
    de.post('/generate/', payload);

export const getHistory = (projectId) =>
    de.get('/history/', { params: { project_id: projectId } });
