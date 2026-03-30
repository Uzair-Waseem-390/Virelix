import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        gemini_api_key: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showApiGuide, setShowApiGuide] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '' });

    useEffect(() => {
        // Password strength checker
        const checkPasswordStrength = (password) => {
            let score = 0;
            if (password.length >= 8) score++;
            if (password.match(/[a-z]/)) score++;
            if (password.match(/[A-Z]/)) score++;
            if (password.match(/[0-9]/)) score++;
            if (password.match(/[^a-zA-Z0-9]/)) score++;

            const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
            return { score, text: strengthText[score] };
        };

        setPasswordStrength(checkPasswordStrength(formData.password));
    }, [formData.password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (passwordStrength.score < 3) {
            setError('Please use a stronger password (at least 8 chars with uppercase, lowercase, and numbers)');
            return;
        }

        setIsLoading(true);

        try {
            const registerResponse = await axios.post('http://127.0.0.1:8000/accounts/register/', {
                email: formData.email,
                password: formData.password,
                gemini_api_key: formData.gemini_api_key,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const loginResponse = await axios.post('http://127.0.0.1:8000/auth/login/', {
                email: formData.email,
                password: formData.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const { access, refresh, role, redirect_to, project_id } = loginResponse.data;

            let cleanRedirectTo = redirect_to;
            if (cleanRedirectTo.startsWith('//')) {
                cleanRedirectTo = cleanRedirectTo.substring(1);
            }
            cleanRedirectTo = cleanRedirectTo.replace(/\/+/g, '/');

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

            navigate(cleanRedirectTo);

        } catch (error) {
            let errorMessage = 'Registration failed. Please check your information.';

            if (error.response) {
                if (error.response.data) {
                    if (typeof error.response.data === 'object') {
                        const firstError = Object.values(error.response.data)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError || errorMessage;
                    } else {
                        errorMessage = error.response.data.detail ||
                            error.response.data.message ||
                            error.response.data.error ||
                            errorMessage;
                    }
                }
            } else if (error.request) {
                errorMessage = 'Cannot connect to server. Please check if backend is running.';
            } else {
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

    const getPasswordStrengthColor = () => {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
        return colors[passwordStrength.score];
    };

    return (
        <>
            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                    20%, 40%, 60%, 80% { transform: translateX(3px); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    50% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(3px); }
                }
                
                .animate-fade-down { animation: fadeInDown 0.6s ease-out; }
                .animate-fade-up { animation: fadeInUp 0.6s ease-out; }
                .animate-shake { animation: shake 0.5s ease-in-out; }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 20s linear infinite; }
                .animate-slide-down { animation: slideDown 0.3s ease-out; }
                .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
                
                .card-hover {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 25px 40px -12px rgba(0, 0, 0, 0.2);
                }
                
                .dropdown-content {
                    animation: slideDown 0.3s ease-out;
                }
                
                .help-button {
                    transition: all 0.3s ease;
                }
                .help-button:hover {
                    transform: scale(1.05);
                    animation: bounce 0.5s ease;
                }
                .help-button:hover span:first-child {
                    animation: pulse-glow 0.5s ease;
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-300/30 to-indigo-300/30 rounded-full filter blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-blue-200/30 rounded-full animate-spin-slow" />
                    <div className="absolute top-1/3 right-20 w-48 h-48 border border-indigo-200/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
                </div>

                <div className="max-w-md w-full relative z-10">
                    {/* Logo & Brand */}
                    <div className="text-center mb-8 animate-fade-down">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-5 group transition-all duration-300 hover:scale-110 hover:rotate-3">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Create Account</h2>
                        <p className="text-gray-500 mt-2">Start your AI-powered ERP journey</p>
                    </div>

                    {/* Register Form Card */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50 card-hover animate-fade-up">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                                        placeholder="admin@virelix.com"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                                        placeholder="Create a strong password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 h-1.5">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`flex-1 rounded-full transition-all duration-300 ${i < passwordStrength.score ? getPasswordStrengthColor() : 'bg-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs mt-1 text-gray-500">
                                            Password strength: <span className="font-medium">{passwordStrength.text}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                                        placeholder="Confirm your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        {showConfirmPassword ? (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                            </div>

                            {/* Gemini API Key Field with Masking */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Gemini API Key
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        name="gemini_api_key"
                                        value={formData.gemini_api_key}
                                        onChange={handleChange}
                                        required
                                        className="block w-full pl-10 pr-24 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                                        placeholder="AIza..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute inset-y-0 right-16 pr-3 flex items-center"
                                    >
                                        {showApiKey ? (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowApiGuide(!showApiGuide)}
                                        className="help-button absolute inset-y-0 right-0 px-3 flex items-center gap-1 text-xs font-medium rounded-r-xl transition-all duration-300"
                                    >
                                        <span className="text-blue-600 text-base animate-pulse-glow inline-block">❓</span>
                                        <span className="text-blue-600 hover:text-blue-700 font-semibold">How to get?</span>
                                    </button>
                                </div>

                                {/* Dropdown Guide */}
                                {showApiGuide && (
                                    <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 dropdown-content">
                                        <div className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="text-sm">
                                                <p className="font-semibold text-gray-800 mb-2">🔑 Get your FREE Gemini API Key:</p>
                                                <ol className="space-y-2 text-gray-700">
                                                    <li className="flex gap-2">
                                                        <span className="font-bold text-blue-600">1.</span>
                                                        <span>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Google AI Studio</a></span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <span className="font-bold text-blue-600">2.</span>
                                                        <span>Sign in with your Google account</span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <span className="font-bold text-blue-600">3.</span>
                                                        <span>Click on <strong>"Get API Key"</strong> in the left sidebar</span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <span className="font-bold text-blue-600">4.</span>
                                                        <span>Click <strong>"Create API Key"</strong> and select your project</span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <span className="font-bold text-blue-600">5.</span>
                                                        <span>Copy the generated key (starts with <strong>"AIza"</strong>)</span>
                                                    </li>
                                                </ol>
                                                <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
                                                    <p className="text-xs text-green-700">
                                                        ✨ <strong>Free Tier Includes:</strong> 60 requests per minute, perfect for getting started!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    Your API key will be encrypted and stored securely. Never share it publicly.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 animate-shake">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                            >
                                {isLoading ? <LoadingSpinner /> : 'Create Account'}
                            </button>

                            {/* Login Link */}
                            <div className="text-center pt-2">
                                <p className="text-gray-600">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Security Note */}
                    <div className="mt-6 text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Your data is encrypted and secure</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>By creating an account, you agree to our Terms</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;