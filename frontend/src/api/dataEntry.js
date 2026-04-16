import axios from 'axios';

// Standalone axios instance — no JWT, uses password header + query param
const de = axios.create({
    baseURL: 'http://127.0.0.1:8000/data_entry',
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
});

// Inject password header + query param on every request
de.interceptors.request.use((config) => {
    const pwd = localStorage.getItem('de_password');
    if (pwd) {
        config.headers['X-DataEntry-Password'] = pwd;
        // Also add as query param for GET requests as fallback
        if (config.method === 'get') {
            config.params = { ...config.params, password: pwd };
        }
    }
    return config;
});

export const verifyPassword  = (password) =>
    de.post('/verify-password/', { password });

export const listUsers        = () =>
    de.get('/users/');

export const listProjects     = (userId) =>
    de.get('/projects/', { params: { user_id: userId } });

export const listMembers      = (projectId) =>
    de.get('/project-members/', { params: { project_id: projectId } });

export const generateData     = (payload) =>
    de.post('/generate/', payload);

export const getHistory       = (projectId) =>
    de.get('/history/', { params: { project_id: projectId } });
