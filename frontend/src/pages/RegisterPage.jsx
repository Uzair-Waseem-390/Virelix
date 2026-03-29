import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        gemini_api_key: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Register the user
            console.log('Registering with:', formData);
            const registerResponse = await axios.post('http://127.0.0.1:8000/accounts/register/', {
                email: formData.email,
                password: formData.password,
                gemini_api_key: formData.gemini_api_key,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Register response:', registerResponse.data);

            // Auto-login after successful registration
            const loginResponse = await axios.post('http://127.0.0.1:8000/auth/login/', {
                email: formData.email,
                password: formData.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Login after register response:', loginResponse.data);

            const { access, refresh, role, redirect_to, project_id } = loginResponse.data;

            // Clean the redirect path (remove double slashes)
            let cleanRedirectTo = redirect_to;
            if (cleanRedirectTo.startsWith('//')) {
                cleanRedirectTo = cleanRedirectTo.substring(1);
            }
            cleanRedirectTo = cleanRedirectTo.replace(/\/+/g, '/');

            // Store in Zustand and localStorage
            useAuthStore.setState({
                user: {
                    email: formData.email,
                    role,
                    project_id,
                    redirect_to: cleanRedirectTo
                },
                accessToken: access,
                refreshToken: refresh,
                isAuthenticated: true,
            });

            // Navigate to the cleaned redirect path
            console.log('Navigating to:', cleanRedirectTo);
            navigate(cleanRedirectTo);

        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error response:', error.response);

            // Extract error message from backend
            let errorMessage = 'Registration failed. Please check your information.';

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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                    <p className="text-gray-600 mt-2">Start your AI-powered ERP journey</p>
                </div>

                {/* Register Form Card */}
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

                        {/* Gemini API Key Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gemini API Key
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="gemini_api_key"
                                    value={formData.gemini_api_key}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="AIza..."
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Your Gemini API key from Google AI Studio. It will be encrypted and stored securely.
                            </p>
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
                            {isLoading ? <LoadingSpinner /> : 'Create Account'}
                        </button>

                        {/* Login Link */}
                        <div className="text-center">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Security Note */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
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

export default RegisterPage;