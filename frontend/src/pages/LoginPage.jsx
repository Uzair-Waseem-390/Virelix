import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Direct axios call for login to avoid interceptor issues
            const response = await axios.post('http://127.0.0.1:8000/auth/login/', {
                email: formData.email,
                password: formData.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Login response:', response.data);

            const { access, refresh, role, redirect_to, project_id } = response.data;

            // Clean the redirect_to path (remove double slashes)
            let cleanRedirectTo = redirect_to;
            if (cleanRedirectTo.startsWith('//')) {
                cleanRedirectTo = cleanRedirectTo.substring(1);
            }
            cleanRedirectTo = cleanRedirectTo.replace(/\/+/g, '/');

            // Store in Zustand and localStorage
            useAuthStore.setState({
                user: { email: formData.email, role, project_id, redirect_to: cleanRedirectTo },
                accessToken: access,
                refreshToken: refresh,
                isAuthenticated: true,
            });

            // Navigate to redirect_to
            console.log('Navigating to:', cleanRedirectTo);
            navigate(cleanRedirectTo);

        } catch (error) {
            console.error('Login error:', error);
            console.error('Error response:', error.response);

            // Extract error message from backend
            let errorMessage = 'Login failed. Please check your credentials.';

            if (error.response) {
                // Server responded with error status
                if (error.response.data) {
                    errorMessage = error.response.data.detail ||
                        error.response.data.message ||
                        error.response.data.error ||
                        errorMessage;
                }
            } else if (error.request) {
                // Request was made but no response
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else {
                // Something else happened
                errorMessage = error.message || errorMessage;
            }

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo & Brand */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6v2H9V7zM9 11h6v2H9v-2zM9 15h4v2H9v-2z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                    <p className="text-gray-600 mt-2">Sign in to your Virelix account</p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="admin@virelix.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <LoadingSpinner /> : 'Sign In'}
                        </button>

                        {/* Register Link */}
                        <div className="text-center">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-600">Secure Login</p>
                    </div>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-600">AI Powered</p>
                    </div>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-600">Real-time</p>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default LoginPage;