import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

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
        }),
        {
            name: 'auth-storage',
            getStorage: () => localStorage,
        }
    )
);