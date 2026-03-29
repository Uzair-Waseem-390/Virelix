import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);

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

    const plans = [
        {
            name: 'Free', price: '$0', period: '/month',
            description: 'Perfect for getting started',
            features: ['1 Project', 'Basic AI Insights', 'Products Module', 'Community Support', 'Basic Analytics'],
            color: 'from-gray-500 to-gray-600', buttonText: 'Get Started', buttonEnabled: true,
        },
        {
            name: 'Starter', price: '$49', period: '/month',
            description: 'Perfect for small businesses',
            features: ['Up to 3 Projects', 'Basic AI Insights', 'Products & Inventory', 'Email Support', 'API Access'],
            color: 'from-blue-500 to-blue-600', buttonText: 'Coming Soon', buttonEnabled: false,
        },
        {
            name: 'Professional', price: '$99', period: '/month',
            description: 'Best for growing companies',
            features: ['Up to 10 Projects', 'Advanced AI Analytics', 'Full ERP Modules', 'Priority Support', 'Custom Integrations', 'Team Collaboration'],
            color: 'from-indigo-500 to-purple-600', buttonText: 'Coming Soon', buttonEnabled: false, popular: true,
        },
        {
            name: 'Enterprise', price: 'Custom', period: '',
            description: 'For large organizations',
            features: ['Unlimited Projects', 'Custom AI Training', 'Dedicated Support', 'SLA Guarantee', 'On-premise Option', '24/7 Phone Support'],
            color: 'from-purple-500 to-pink-600', buttonText: 'Coming Soon', buttonEnabled: false,
        },
    ];

    const features = [
        { icon: '🤖', title: 'AI-Powered Automation', description: 'Describe your business in plain English — Virelix AI reads it, maps your modules, and builds your ERP automatically.', gradient: 'from-blue-500 to-blue-600' },
        { icon: '📊', title: 'Real-time Analytics', description: 'Live dashboards and AI insights so you can make data-driven decisions the moment they matter.', gradient: 'from-emerald-500 to-green-600' },
        { icon: '🔒', title: 'Enterprise Security', description: 'JWT authentication, role-based access control, and project-level data isolation — built in from day one.', gradient: 'from-purple-500 to-purple-600' },
        { icon: '⚡', title: 'Lightning Fast', description: 'Django REST + Redis-powered APIs with response times consistently under 500ms.', gradient: 'from-orange-500 to-orange-600' },
        { icon: '🔄', title: 'Celery Background Jobs', description: 'Low-stock alerts, automated notifications, and workflow triggers running silently in the background.', gradient: 'from-pink-500 to-pink-600' },
        { icon: '🌍', title: 'Multi-Role Dashboards', description: 'Admin, Manager, and Staff each get their own tailored view — scoped to exactly what they need.', gradient: 'from-teal-500 to-teal-600' },
    ];

    const stats = [
        { value: '99.9%', label: 'Uptime SLA', gradient: 'from-blue-500 to-cyan-500' },
        { value: '<500ms', label: 'Response Time', gradient: 'from-green-500 to-emerald-500' },
        { value: '10K+', label: 'Businesses', gradient: 'from-purple-500 to-pink-500' },
        { value: '24/7', label: 'Support', gradient: 'from-orange-500 to-red-500' },
    ];

    const workflow = [
        { step: '01', title: 'Describe Your Business', desc: 'Write your requirements in plain English — no technical knowledge needed.' },
        { step: '02', title: 'AI Analyzes & Configures', desc: 'OpenAI reads your input and activates exactly the right ERP modules for your workflow.' },
        { step: '03', title: 'Roles & Project Created', desc: 'Admin, Manager, and Staff accounts are auto-generated with correct scoped access.' },
        { step: '04', title: 'Operate & Scale', desc: 'Use your live dashboard, track KPIs, and let background jobs handle alerts automatically.' },
    ];

    return (
        <>
            <style>{`
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
                @keyframes float-delayed { 0%,100%{transform:translateY(-8px)} 50%{transform:translateY(12px)} }
                @keyframes fade-in-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
                @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 12px rgba(99,102,241,0)} }
                @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
                @keyframes bounce-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
                @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
                .animate-fade-in-up { animation: fade-in-up 0.7s ease both; }
                .animate-fade-in-up-d1 { animation: fade-in-up 0.7s 0.12s ease both; }
                .animate-fade-in-up-d2 { animation: fade-in-up 0.7s 0.24s ease both; }
                .animate-fade-in-up-d3 { animation: fade-in-up 0.7s 0.36s ease both; }
                .animate-fade-in-up-d4 { animation: fade-in-up 0.7s 0.48s ease both; }
                .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
                .animate-spin-slow { animation: spin-slow 22s linear infinite; }

                /* Scroll reveal */
                .vx-reveal { opacity:0; transform:translateY(28px); transition:opacity 0.6s ease, transform 0.6s ease; }
                .vx-reveal.vx-visible { opacity:1; transform:translateY(0); }

                /* Stagger via nth-child on parent .vx-stagger */
                .vx-stagger .vx-reveal:nth-child(1) { transition-delay:0s; }
                .vx-stagger .vx-reveal:nth-child(2) { transition-delay:0.1s; }
                .vx-stagger .vx-reveal:nth-child(3) { transition-delay:0.2s; }
                .vx-stagger .vx-reveal:nth-child(4) { transition-delay:0.3s; }
                .vx-stagger .vx-reveal:nth-child(5) { transition-delay:0.4s; }
                .vx-stagger .vx-reveal:nth-child(6) { transition-delay:0.5s; }

                /* Shimmer text — blue/indigo, matching brand */
                .shimmer-text {
                    background: linear-gradient(90deg, #1d4ed8, #4f46e5, #7c3aed, #4f46e5, #1d4ed8);
                    background-size: 200% auto;
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 4s linear infinite;
                }

                /* Dashboard card colors — deep solid so visible at REST state */
                .dash-blue   { background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%); }
                .dash-green  { background: linear-gradient(135deg, #065f46 0%, #059669 55%, #10b981 100%); }
                .dash-purple { background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #8b5cf6 100%); }

                /* Feature card */
                .feature-card { transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
                .feature-card:hover { transform:translateY(-10px) scale(1.02); box-shadow:0 24px 48px rgba(99,102,241,0.14); }

                /* Pricing card */
                .price-card { transition: transform 0.35s ease, box-shadow 0.35s ease; }
                .price-card:hover { transform:translateY(-10px); }

                /* Ticker */
                .ticker-wrap { overflow:hidden; }
                .ticker-inner { display:flex; width:max-content; animation:ticker 32s linear infinite; }
                .ticker-inner:hover { animation-play-state:paused; }

                /* Workflow step */
                .workflow-step { transition:all 0.3s ease; }
                .workflow-step:hover { transform:translateX(6px); box-shadow:0 16px 40px rgba(99,102,241,0.12); border-color:#a5b4fc !important; }

                /* Nav underline */
                .nav-link { position:relative; }
                .nav-link::after { content:''; position:absolute; bottom:-2px; left:0; width:0; height:2px; background:linear-gradient(90deg,#2563eb,#6366f1); border-radius:2px; transition:width 0.3s ease; }
                .nav-link:hover::after { width:100%; }
            `}</style>

            <div className="min-h-screen bg-white">

                {/* ═══ NAV ═══ */}
                <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' : 'bg-transparent'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-2 group cursor-pointer">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/50 group-hover:scale-110 transition-all duration-300">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6v2H9V7zM9 11h6v2H9v-2zM9 15h4v2H9v-2z" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Virelix</span>
                            </div>
                            <div className="hidden md:flex space-x-8">
                                <a href="#features" className="nav-link text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
                                <a href="#how-it-works" className="nav-link text-gray-700 hover:text-blue-600 transition-colors font-medium">How It Works</a>
                                <a href="#pricing" className="nav-link text-gray-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
                                <Link to="/about" className="nav-link text-gray-700 hover:text-blue-600 transition-colors font-medium">About</Link>
                            </div>
                            <div className="flex space-x-3 items-center">
                                <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm">Sign In</Link>
                                <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 animate-pulse-glow">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ═══ HERO ═══ */}
                <section className="relative overflow-hidden pt-28 pb-16 px-4 min-h-screen flex items-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
                    {/* Blobs */}
                    <div className="absolute top-20 left-8 w-80 h-80 bg-gradient-to-r from-blue-300/60 to-blue-400/40 rounded-full filter blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-8 w-80 h-80 bg-gradient-to-r from-indigo-300/60 to-purple-400/40 rounded-full filter blur-3xl animate-float-delayed" />
                    <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-r from-cyan-300/40 to-blue-300/30 rounded-full filter blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
                    {/* Decorative rings */}
                    <div className="absolute top-12 right-12 w-72 h-72 border border-blue-200/40 rounded-full animate-spin-slow" />
                    <div className="absolute top-24 right-24 w-52 h-52 border border-indigo-200/30 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '14s' }} />

                    <div className="relative max-w-7xl mx-auto w-full">
                        <div className="text-center max-w-4xl mx-auto">
                            {/* Badge */}
                            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200/60 text-blue-700 text-sm font-semibold mb-6 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
                                🚀 AI-Powered ERP Solution
                            </div>

                            {/* Headline — same as original structure */}
                            <h1 className="animate-fade-in-up-d1 text-5xl md:text-7xl font-bold mb-6 leading-tight">
                                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                                    Transform Your Business
                                </span>
                                <br />
                                <span className="shimmer-text">with Intelligent ERP</span>
                            </h1>

                            <p className="animate-fade-in-up-d2 text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Virelix combines the power of AI with enterprise resource planning to automate workflows,
                                gain insights, and scale your operations seamlessly.
                            </p>

                            <div className="animate-fade-in-up-d3 flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/register" className="group px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                                    Start Free Trial
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                                <a href="#how-it-works" className="px-8 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300">
                                    How It Works
                                </a>
                            </div>

                            <div className="animate-fade-in-up-d4 flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
                                {['✓ No credit card required', '✓ Free forever plan', '✓ 2-minute setup'].map(t => (
                                    <span key={t} className="font-medium">{t}</span>
                                ))}
                            </div>
                        </div>

                        {/* ═══ DASHBOARD PREVIEW (FIXED) ═══ */}
                        <div className="animate-fade-in-up-d4 mt-20 relative">
                            {/* Glow halo */}
                            <div className="absolute -inset-3 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-3xl filter blur-xl" />

                            <div className="relative bg-gray-900 rounded-2xl shadow-2xl border border-gray-700/60 overflow-hidden hover:scale-[1.015] transition-transform duration-500">
                                {/* Title bar */}
                                <div className="bg-gray-800 px-5 py-3.5 flex items-center space-x-2 border-b border-gray-700/50">
                                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                                    <span className="text-gray-400 text-sm ml-4 font-mono">Virelix — Admin Dashboard</span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        <span className="text-green-400 text-xs font-semibold">Live</span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                                    {/* ── Metric cards — FIXED: deep solid colors at rest ── */}
                                    <div className="grid md:grid-cols-3 gap-5 mb-5">
                                        <div className="dash-blue rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
                                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                                            <div className="absolute -bottom-6 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                                            <div className="relative">
                                                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
                                                <p className="text-4xl font-bold mb-2">$124,592</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">↑ 23%</span>
                                                    <span className="text-blue-100 text-xs">from last month</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="dash-green rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
                                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                                            <div className="absolute -bottom-6 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                                            <div className="relative">
                                                <p className="text-green-100 text-xs font-semibold uppercase tracking-wider mb-2">Products Sold</p>
                                                <p className="text-4xl font-bold mb-2">2,847</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">↑ 15%</span>
                                                    <span className="text-green-100 text-xs">from last month</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="dash-purple rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
                                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                                            <div className="absolute -bottom-6 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                                            <div className="relative">
                                                <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider mb-2">AI Accuracy</p>
                                                <p className="text-4xl font-bold mb-2">98%</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">↑ 5%</span>
                                                    <span className="text-purple-100 text-xs">improvement</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mini chart + alerts */}
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Revenue Trend</p>
                                            <svg viewBox="0 0 300 72" className="w-full" style={{ height: 56 }}>
                                                <defs>
                                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M0,62 C20,54 40,48 70,40 S110,26 150,18 S210,8 250,4 L300,2" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                                <path d="M0,62 C20,54 40,48 70,40 S110,26 150,18 S210,8 250,4 L300,2 L300,72 L0,72Z" fill="url(#chartGrad)" />
                                                <circle cx="300" cy="2" r="3.5" fill="#3b82f6" />
                                            </svg>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">AI Alerts</p>
                                            {[{ c: '#f59e0b', t: 'Low stock: Widget A' }, { c: '#10b981', t: 'Top seller: Product X' }, { c: '#6366f1', t: 'Sales spike +34%' }].map((a, i) => (
                                                <div key={i} className="flex items-center gap-2 mb-2.5">
                                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.c }} />
                                                    <span className="text-xs text-gray-600">{a.t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Fade bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-2xl" />
                        </div>
                    </div>
                </section>

                {/* ═══ TICKER ═══ */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 overflow-hidden">
                    <div className="ticker-inner">
                        {[...Array(2)].map((_, rep) =>
                            ['AI-Powered ERP', 'Role-Based Access', 'Real-time Analytics', 'Celery Background Jobs', 'JWT Security', 'Sub-500ms APIs', 'Products & Inventory', 'Sales Automation'].map((item, i) => (
                                <span key={`${rep}-${i}`} className="inline-flex items-center gap-3 px-8 text-white/90 text-sm font-semibold whitespace-nowrap">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
                                    {item}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                {/* ═══ STATS ═══ */}
                <section className="py-16 px-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 vx-stagger">
                            {stats.map((stat, i) => (
                                <div key={i} className="vx-reveal text-center group">
                                    <div className={`text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-gray-400 text-sm font-medium uppercase tracking-wide">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ FEATURES ═══ */}
                <section id="features" className="py-24 px-4 bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-80 h-80 bg-blue-50 rounded-full filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50 rounded-full filter blur-3xl opacity-70 translate-x-1/3 translate-y-1/3" />

                    <div className="max-w-7xl mx-auto relative">
                        <div className="text-center mb-16">
                            <div className="vx-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-5">
                                ✦ Features
                            </div>
                            <h2 className="vx-reveal text-4xl md:text-5xl font-bold text-gray-900 mb-5">
                                Powerful Features for<br />
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Modern Business</span>
                            </h2>
                            <p className="vx-reveal text-xl text-gray-500 max-w-2xl mx-auto">
                                Everything you need to manage and scale your operations, powered by AI from day one.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 vx-stagger">
                            {features.map((feature, i) => (
                                <div key={i}
                                    className="feature-card vx-reveal group bg-white rounded-2xl p-8 shadow-md border border-gray-100 cursor-pointer"
                                    onMouseEnter={() => setActiveFeature(i)}
                                    onMouseLeave={() => setActiveFeature(null)}
                                >
                                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                        <span className="text-2xl">{feature.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-500 leading-relaxed">{feature.description}</p>
                                    <div className={`mt-5 flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-all duration-300 ${activeFeature === i ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                                        Learn more
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ HOW IT WORKS ═══ */}
                <section id="how-it-works" className="py-24 px-4 bg-gradient-to-br from-gray-50 to-blue-50/40">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="vx-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold mb-5">
                                ✦ How It Works
                            </div>
                            <h2 className="vx-reveal text-4xl md:text-5xl font-bold text-gray-900 mb-5">
                                From Idea to ERP<br />
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">in 4 Simple Steps</span>
                            </h2>
                            <p className="vx-reveal text-xl text-gray-500 max-w-xl mx-auto">No technical knowledge required — just describe your business.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5 vx-stagger">
                            {workflow.map((step, i) => (
                                <div key={i} className="workflow-step vx-reveal group bg-white rounded-2xl p-7 shadow-md border border-gray-100 flex gap-5 cursor-default">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                                        {step.step}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                                        <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="vx-reveal mt-10 text-center">
                            <div className="inline-flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400 font-medium">
                                {['User Input', 'AI Analysis', 'Project Setup', 'ERP Dashboard', 'Workflow Execution'].map((s, i, arr) => (
                                    <span key={s} className="flex items-center gap-2">
                                        <span className={`font-semibold ${['text-blue-500', 'text-indigo-500', 'text-purple-500', 'text-green-500', 'text-orange-500'][i]}`}>{s}</span>
                                        {i < arr.length - 1 && <span className="text-gray-300">→</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ PRICING ═══ */}
                <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="vx-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-semibold mb-5">
                                ✦ Pricing
                            </div>
                            <h2 className="vx-reveal text-4xl md:text-5xl font-bold text-gray-900 mb-5">
                                Simple, Transparent Pricing
                            </h2>
                            <p className="vx-reveal text-xl text-gray-500 max-w-xl mx-auto">Choose the plan that best fits your business needs. Start free, scale when ready.</p>
                        </div>

                        <div className="grid md:grid-cols-4 gap-6 vx-stagger">
                            {plans.map((plan, i) => (
                                <div key={i} className={`price-card vx-reveal relative bg-white rounded-2xl shadow-xl overflow-hidden border ${plan.popular ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-indigo-100' : 'border-gray-100'}`}>
                                    {plan.popular && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />}
                                    {plan.popular && (
                                        <div className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-0.5 rounded-full text-xs font-bold">Most Popular</div>
                                    )}
                                    <div className="p-7">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                                        <p className="text-gray-500 text-sm mb-5 min-h-[44px]">{plan.description}</p>
                                        <div className="mb-6">
                                            <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                            {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                                        </div>
                                        <div className="border-t border-gray-100 pt-5 mb-6 min-h-[220px]">
                                            {plan.features.map((feature, j) => (
                                                <div key={j} className="flex items-center gap-2.5 mb-3">
                                                    <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                    <span className="text-gray-600 text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {plan.buttonEnabled ? (
                                            <Link to="/register" className={`block w-full py-3 bg-gradient-to-r ${plan.color} text-white rounded-xl font-semibold text-center text-sm hover:shadow-lg hover:scale-105 transition-all duration-300`}>
                                                {plan.buttonText}
                                            </Link>
                                        ) : (
                                            <button disabled className="w-full py-3 bg-gray-50 text-gray-400 rounded-xl font-semibold text-sm cursor-not-allowed border border-gray-200">
                                                {plan.buttonText}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CTA ═══ */}
                <section className="py-24 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_50%,rgba(255,255,255,0.08),transparent_55%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_50%,rgba(255,255,255,0.06),transparent_55%)]" />
                    <div className="absolute -top-24 -left-24 w-80 h-80 border border-white/10 rounded-full animate-spin-slow" />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 border border-white/10 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse' }} />

                    <div className="relative max-w-4xl mx-auto text-center">
                        <h2 className="vx-reveal text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
                            Ready to Transform<br />Your Business?
                        </h2>
                        <p className="vx-reveal text-xl text-blue-100 mb-10 max-w-xl mx-auto">
                            Join thousands of businesses using Virelix to automate and scale their operations with the power of AI.
                        </p>
                        <div className="vx-reveal flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register" className="animate-bounce-slow inline-block px-10 py-4 bg-white text-blue-700 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300">
                                Get Started Now — It's Free
                            </Link>
                            <a href="#features" className="inline-block px-8 py-4 border-2 border-white/40 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-white transition-all duration-300">
                                Explore Features
                            </a>
                        </div>
                    </div>
                </section>

                {/* ═══ FOOTER ═══ */}
                <footer className="bg-gray-900 text-white pt-16 pb-8 px-4">
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
                                    <li><a href="#features" className="text-gray-500 hover:text-white transition-colors text-sm">Features</a></li>
                                    <li><a href="#how-it-works" className="text-gray-500 hover:text-white transition-colors text-sm">How It Works</a></li>
                                    <li><a href="#pricing" className="text-gray-500 hover:text-white transition-colors text-sm">Pricing</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-4">Company</h4>
                                <ul className="space-y-2.5">
                                    <li><Link to="/about" className="text-gray-500 hover:text-white transition-colors text-sm">About</Link></li>
                                    <li><a href="https://www.linkedin.com/in/uzair-waseem-digital/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm">LinkedIn</a></li>
                                    <li><a href="https://github.com/Uzair-Waseem-390" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm">GitHub</a></li>
                                    <li><a href="https://portfolio-five-opal-76.vercel.app/" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors text-sm">Portfolio</a></li>
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

export default LandingPage;