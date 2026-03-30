import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // Auth state
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            // Dashboard state
            adminDashboardData: null,
            currentProject: null,

            login: async (email, password) => {
                try {
                    const response = await axios.post('http://127.0.0.1:8000/auth/login/', {
                        email,
                        password,
                    });

                    const { access, refresh, role, redirect_to, project_id } = response.data;

                    // Ensure redirect_to doesn't have double slashes
                    const cleanRedirectTo = redirect_to.replace(/\/+/g, '/');

                    set({
                        user: { email, role, project_id, redirect_to: cleanRedirectTo },
                        accessToken: access,
                        refreshToken: refresh,
                        isAuthenticated: true,
                    });

                    return { success: true, redirect_to: cleanRedirectTo };
                } catch (error) {
                    const detail = error.response?.data?.detail || error.response?.data?.message;
                    return {
                        success: false,
                        error: detail || 'Login failed. Please check your credentials.'
                    };
                }
            },

            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    adminDashboardData: null,
                    currentProject: null,
                });
            },

            setAccessToken: (token) => {
                set({ accessToken: token });
            },

            setUserEmail: (email) => {
                const { user } = get();
                if (user) {
                    set({ user: { ...user, email } });
                }
            },

            // Dashboard actions
            setAdminDashboardData: (data) => {
                set({ adminDashboardData: data });
            },

            setCurrentProject: (project) => {
                set({ currentProject: project });
            },

            clearCurrentProject: () => {
                set({ currentProject: null });
            },

            // Helper to get notification count
            getNotificationCount: () => {
                const { adminDashboardData, currentProject } = get();
                if (currentProject) {
                    const lowStock = currentProject.low_stock_items?.length || 0;
                    const outOfStock = currentProject.out_of_stock_items?.length || 0;
                    return lowStock + outOfStock;
                }
                if (adminDashboardData) {
                    const lowStock = adminDashboardData.low_stock_items?.length || 0;
                    const outOfStock = adminDashboardData.out_of_stock_items?.length || 0;
                    return lowStock + outOfStock;
                }
                return 0;
            },

            // Helper to check if user has specific role
            hasRole: (role) => {
                const { user } = get();
                return user?.role === role;
            },

            // Helper to check if user is admin
            isAdmin: () => {
                const { user } = get();
                return user?.role === 'admin';
            },

            // Helper to check if user is manager
            isManager: () => {
                const { user } = get();
                return user?.role === 'manager';
            },

            // Helper to check if user is staff
            isStaff: () => {
                const { user } = get();
                return user?.role === 'staff';
            },
        }),
        {
            name: 'auth-storage',
            getStorage: () => localStorage,
        }
    )
);