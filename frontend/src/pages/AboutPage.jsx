import { Link } from 'react-router-dom';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-110">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Virelix
                            </span>
                        </Link>
                        <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                        <h1 className="text-4xl font-bold mb-2">About Me</h1>
                        <p className="text-blue-100">Full Stack Developer & AI Enthusiast</p>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                            <div className="md:w-1/3">
                                <img
                                    src="/uzair1.png"
                                    alt="Uzair Waseem"
                                    className="w-full rounded-2xl shadow-lg border-4 border-blue-100"
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x300?text=Uzair+Waseem';
                                    }}
                                />
                            </div>
                            <div className="md:w-2/3">
                                <h2 className="text-2xl font-bold text-gray-800 mb-3">Uzair Waseem</h2>
                                <p className="text-gray-600 mb-4 leading-relaxed">
                                    Passionate Full Stack Developer with 1.5+ years of experience building scalable web applications
                                    and AI-powered solutions. Specialized in modern web technologies and cloud architecture.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span className="text-gray-700">+92 3281525502</span>
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-700">uzairwaseem390@gmail.com</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Tech Stack & Expertise</h3>
                            <div className="flex flex-wrap gap-3">
                                {['Django', 'Django REST Framework', 'FastAPI', 'React', 'OpenAI SDK', 'MCP Servers', 'Python', 'JavaScript', 'Tailwind CSS', 'PostgreSQL', 'Redis', 'Celery'].map((tech) => (
                                    <span key={tech} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 rounded-lg text-sm font-medium">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Connect With Me</h3>
                            <div className="flex gap-4">
                                <a
                                    href="https://www.linkedin.com/in/uzair-waseem-digital/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                    LinkedIn
                                </a>
                                <a
                                    href="https://github.com/Uzair-Waseem-390"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </a>
                                <a
                                    href="https://portfolio-five-opal-76.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Portfolio
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-4">About Virelix Project</h3>
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                                <p className="text-gray-700 leading-relaxed mb-3">
                                    Virelix is an AI-powered ERP (Enterprise Resource Planning) system designed to revolutionize
                                    how businesses manage their operations. Built with cutting-edge technologies, Virelix combines
                                    the power of artificial intelligence with comprehensive business management tools.
                                </p>
                                <p className="text-gray-700 leading-relaxed mb-3">
                                    <strong className="font-semibold">Key Features:</strong>
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                                    <li>AI-driven business requirement analysis</li>
                                    <li>Dynamic module configuration based on business needs</li>
                                    <li>Real-time inventory and sales tracking</li>
                                    <li>Role-based access control with JWT authentication</li>
                                    <li>Automated low stock alerts and AI insights</li>
                                    <li>Scalable architecture with Celery and Redis for background jobs</li>
                                </ul>
                                <p className="text-gray-700 leading-relaxed mt-3">
                                    The system automatically configures ERP modules (Products, Inventory, Sales) based on business
                                    descriptions provided by admins, making it incredibly flexible and adaptive to diverse business requirements.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;