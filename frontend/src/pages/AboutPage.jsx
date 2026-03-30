import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const AboutPage = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll reveal
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vx-visible'); }),
            { threshold: 0.12 }
        );
        document.querySelectorAll('.vx-reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const techStack = [
        { name: 'Django', color: 'from-green-600 to-green-700' },
        { name: 'Django REST', color: 'from-red-600 to-red-700' },
        { name: 'FastAPI', color: 'from-teal-500 to-green-500' },
        { name: 'React', color: 'from-cyan-500 to-blue-500' },
        { name: 'OpenAI SDK', color: 'from-emerald-500 to-teal-500' },
        { name: 'MCP Servers', color: 'from-indigo-500 to-purple-500' },
        { name: 'Python', color: 'from-blue-500 to-blue-600' },
        { name: 'JavaScript', color: 'from-yellow-500 to-amber-500' },
        { name: 'Tailwind CSS', color: 'from-sky-500 to-cyan-500' },
        { name: 'PostgreSQL', color: 'from-blue-700 to-indigo-700' },
        { name: 'Redis', color: 'from-red-500 to-red-600' },
        { name: 'Celery', color: 'from-green-500 to-emerald-500' },
    ];

    const features = [
        { icon: '🤖', title: 'AI Business Analysis', desc: 'Automatically analyzes business requirements and configures modules' },
        { icon: '⚙️', title: 'Dynamic Module Config', desc: 'Products, Inventory, Sales modules configured based on needs' },
        { icon: '📈', title: 'Real-time Tracking', desc: 'Live inventory and sales tracking with instant insights' },
        { icon: '🔐', title: 'JWT Authentication', desc: 'Secure role-based access control for all users' },
        { icon: '🔔', title: 'Automated Alerts', desc: 'Low stock alerts and AI-powered business insights' },
        { icon: '⚡', title: 'Scalable Architecture', desc: 'Celery & Redis for efficient background job processing' },
    ];

    return (
        <>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(15px); }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes border-pulse {
                    0%, 100% { border-color: rgba(99, 102, 241, 0.2); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.1); }
                    50% { border-color: rgba(99, 102, 241, 0.5); box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
                }
                
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
                .animate-fade-in-up { animation: fade-in-up 0.7s ease both; }
                .animate-fade-in-up-d1 { animation: fade-in-up 0.7s 0.12s ease both; }
                .animate-fade-in-up-d2 { animation: fade-in-up 0.7s 0.24s ease both; }
                .animate-fade-in-up-d3 { animation: fade-in-up 0.7s 0.36s ease both; }
                .animate-fade-in-up-d4 { animation: fade-in-up 0.7s 0.48s ease both; }
                .animate-spin-slow { animation: spin-slow 22s linear infinite; }
                
                /* Scroll reveal */
                .vx-reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
                .vx-reveal.vx-visible { opacity: 1; transform: translateY(0); }
                
                /* Stagger children */
                .vx-stagger .vx-reveal:nth-child(1) { transition-delay: 0s; }
                .vx-stagger .vx-reveal:nth-child(2) { transition-delay: 0.1s; }
                .vx-stagger .vx-reveal:nth-child(3) { transition-delay: 0.2s; }
                .vx-stagger .vx-reveal:nth-child(4) { transition-delay: 0.3s; }
                .vx-stagger .vx-reveal:nth-child(5) { transition-delay: 0.4s; }
                .vx-stagger .vx-reveal:nth-child(6) { transition-delay: 0.5s; }
                
                .shimmer-text {
                    background: linear-gradient(90deg, #1d4ed8, #4f46e5, #7c3aed, #4f46e5, #1d4ed8);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s linear infinite;
                }
                
                .tech-chip {
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .tech-chip:hover {
                    transform: translateY(-4px) scale(1.05);
                }
                
                .feature-card-about {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .feature-card-about:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12);
                }
                
                .nav-link {
                    position: relative;
                }
                .nav-link::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #2563eb, #6366f1);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }
                .nav-link:hover::after {
                    width: 100%;
                }
                
                .profile-img {
                    animation: border-pulse 2s ease-in-out infinite;
                }
            `}</style>

            <div className="min-h-screen bg-white">
                {/* ═══ NAV ═══ */}
                <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-transparent'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <Link to="/" className="flex items-center space-x-2 group">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6v2H9V7zM9 11h6v2H9v-2zM9 15h4v2H9v-2z" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Virelix</span>
                            </Link>
                            <div className="flex items-center space-x-6">
                                <Link to="/" className="nav-link text-gray-600 hover:text-blue-600 transition-colors font-medium hidden md:inline-block">
                                    Back to Home
                                </Link>
                                <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ═══ HERO SECTION ═══ */}
                <section className="relative overflow-hidden pt-28 pb-16 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                    <div className="absolute top-20 left-8 w-80 h-80 bg-gradient-to-r from-blue-300/40 to-blue-400/30 rounded-full filter blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-8 w-80 h-80 bg-gradient-to-r from-indigo-300/40 to-purple-400/30 rounded-full filter blur-3xl animate-float-delayed" />
                    <div className="absolute top-1/3 left-1/4 w-56 h-56 bg-gradient-to-r from-cyan-300/30 to-blue-300/30 rounded-full filter blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
                    <div className="absolute top-12 right-12 w-72 h-72 border border-blue-200/40 rounded-full animate-spin-slow" />
                    <div className="absolute bottom-12 left-12 w-52 h-52 border border-indigo-200/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '14s' }} />

                    <div className="relative max-w-6xl mx-auto text-center">
                        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200/60 text-blue-700 text-sm font-semibold mb-6 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                            ✦ Meet the Creator
                        </div>
                        <h1 className="animate-fade-in-up-d1 text-5xl md:text-6xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                                About
                            </span>
                            <br />
                            <span className="shimmer-text">Uzair Waseem</span>
                        </h1>
                        <p className="animate-fade-in-up-d2 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Full Stack Developer & AI Enthusiast — crafting intelligent web solutions that transform businesses.
                        </p>
                    </div>
                </section>

                {/* ═══ MAIN CONTENT ═══ */}
                <div className="max-w-6xl mx-auto px-4 py-12 -mt-8 relative z-10">
                    {/* Profile Card */}
                    <div className="vx-reveal bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-12 hover:shadow-2xl transition-shadow duration-500">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full" />
                            <div className="relative flex flex-col md:flex-row gap-6 items-center md:items-start">
                                <div className="profile-img relative w-32 h-32 rounded-2xl border-4 border-white/30 shadow-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <img
                                        src="/uzair1.png"
                                        alt="Uzair Waseem"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%234f46e5"/%3E%3Ctext x="50" y="55" font-size="40" text-anchor="middle" fill="white" font-family="Arial"%3EUW%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold mb-2">Uzair Waseem</h2>
                                    <p className="text-blue-100 text-lg mb-3">Full Stack Developer | AI Specialist</p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>+92 3281525502</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>uzairwaseem390@gmail.com</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-600 leading-relaxed text-lg mb-4">
                                Passionate Full Stack Developer with <strong className="text-blue-600">1.5+ years of experience</strong> building scalable web applications
                                and AI-powered solutions. Specialized in modern web technologies, cloud architecture, and creating intelligent systems
                                that solve real-world business problems.
                            </p>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    10+ Projects Completed
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    AI-First Approach
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    Cloud Native
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="vx-reveal mb-12">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-4">
                                ⚡ Tech Stack
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">Expertise & Technologies</h3>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {techStack.map((tech, i) => (
                                <span
                                    key={tech.name}
                                    className={`tech-chip vx-reveal px-5 py-2.5 bg-gradient-to-r ${tech.color} text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-xl cursor-default`}
                                    style={{ transitionDelay: `${i * 0.03}s` }}
                                >
                                    {tech.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Virelix Project Section */}
                    <div className="vx-reveal mb-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-sm font-semibold mb-4">
                                🚀 The Project
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-3">About Virelix ERP</h3>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                AI-powered Enterprise Resource Planning system that revolutionizes business management
                            </p>
                        </div>
                        <p className="text-gray-700 leading-relaxed mb-6 text-center max-w-3xl mx-auto">
                            Virelix combines the power of artificial intelligence with comprehensive business management tools.
                            The system automatically configures ERP modules based on business descriptions, making it incredibly
                            flexible and adaptive to diverse business requirements.
                        </p>

                        <div className="grid md:grid-cols-3 gap-5 mt-8 vx-stagger">
                            {features.map((feature, idx) => (
                                <div key={idx} className="feature-card-about vx-reveal bg-white rounded-xl p-5 shadow-md border border-gray-100">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                                        <span className="text-2xl">{feature.icon}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 mb-2">{feature.title}</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Connect Section */}
                    <div className="vx-reveal text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-semibold mb-4">
                            🔗 Connect With Me
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-6">Let's Build Something Amazing</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="https://www.linkedin.com/in/uzair-waseem-digital/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                                LinkedIn
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </a>
                            <a
                                href="https://github.com/Uzair-Waseem-390"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-gray-500/30 hover:scale-105 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </a>
                            <a
                                href="https://portfolio-five-opal-76.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Portfolio
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* ═══ FOOTER ═══ */}
                <footer className="bg-gray-900 text-white pt-16 pb-8 px-4 mt-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-4 gap-12 mb-12">
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6v2H9V7zM9 11h6v2H9v-2zM9 15h4v2H9v-2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Virelix</span>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    AI-powered ERP solution for modern businesses. Transform your operations with intelligent automation.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-4">Product</h4>
                                <ul className="space-y-2.5">
                                    <li><a href="/#features" className="text-gray-500 hover:text-white transition-colors text-sm">Features</a></li>
                                    <li><a href="/#how-it-works" className="text-gray-500 hover:text-white transition-colors text-sm">How It Works</a></li>
                                    <li><a href="/#pricing" className="text-gray-500 hover:text-white transition-colors text-sm">Pricing</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-4">Company</h4>
                                <ul className="space-y-2.5">
                                    <li><Link to="/about" className="text-gray-500 hover:text-white transition-colors text-sm">About</Link></li>
                                    <li><a href="https://www.linkedin.com/in/uzair-waseem-digital/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm">LinkedIn</a></li>
                                    <li><a href="https://github.com/Uzair-Waseem-390" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm">GitHub</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-4">Legal</h4>
                                <ul className="space-y-2.5">
                                    <li><Link to="/privacy" className="text-gray-500 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                                    <li><Link to="/terms" className="text-gray-500 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                                    <li><Link to="/security" className="text-gray-500 hover:text-white transition-colors text-sm">Security</Link></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-3 text-gray-500 text-sm">
                            <p>&copy; 2026 Virelix. All rights reserved.</p>
                            <p>Built with Django REST · React · OpenAI · Celery + Redis</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default AboutPage;