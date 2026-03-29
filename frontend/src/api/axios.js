import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosInstance = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: false, // Set to false for JWT auth
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request interceptor - add access token
axiosInstance.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        // Log request for debugging
        console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
    (response) => {
        console.log(`Response from ${response.config.url}:`, response.status);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Log error for debugging
        console.error('Response error:', error.response?.status, error.response?.data);

        // If error is not 401 or request already retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // If we're already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                })
                .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const { refreshToken, logout } = useAuthStore.getState();

        try {
            const response = await axios.post('http://127.0.0.1:8000/auth/refresh/', {
                refresh: refreshToken,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const { access } = response.data;
            useAuthStore.getState().setAccessToken(access);

            processQueue(null, access);

            originalRequest.headers.Authorization = `Bearer ${access}`;
            return axiosInstance(originalRequest);
        } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            processQueue(refreshError, null);
            logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default axiosInstance;