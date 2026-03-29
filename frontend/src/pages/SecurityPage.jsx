import { Link } from 'react-router-dom';

const SecurityPage = () => {
    return (
        <div className="min-h-screen bg-white">
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-110">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Virelix</span>
                        </Link>
                        <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Back to Home</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Security</h1>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Security Overview</h2>
                        <p className="text-gray-600 mb-4">At Virelix, security is our top priority. We implement industry-standard security measures to protect your data and ensure the integrity of our platform.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Data Encryption</h2>
                        <p className="text-gray-600 mb-4">All data transmitted between your browser and our servers is encrypted using TLS 1.3. Your Gemini API key and other sensitive information are encrypted at rest using AES-256 encryption.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Authentication & Access Control</h2>
                        <p className="text-gray-600 mb-4">We use JWT (JSON Web Tokens) for secure authentication. Role-based access control (RBAC) ensures that users can only access data and features appropriate for their role (Admin, Manager, Staff).</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Data Isolation</h2>
                        <p className="text-gray-600 mb-4">Each project has completely isolated data. Users from one project cannot access data from another project, ensuring perfect data segregation and privacy.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">API Security</h2>
                        <p className="text-gray-600 mb-4">All API endpoints require authentication and enforce proper authorization. We implement rate limiting to prevent abuse and DDoS attacks.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Security Best Practices</h2>
                        <ul className="list-disc list-inside text-gray-600 mb-4 ml-4">
                            <li>Regular security audits and penetration testing</li>
                            <li>Automatic security updates and patches</li>
                            <li>Secure password hashing using bcrypt</li>
                            <li>Protection against common web vulnerabilities (XSS, CSRF, SQL Injection)</li>
                            <li>Regular backups with encryption</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Incident Response</h2>
                        <p className="text-gray-600 mb-4">We have a dedicated incident response team that monitors our systems 24/7 for any security threats. In the event of a security incident, we will notify affected users promptly.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Reporting Vulnerabilities</h2>
                        <p className="text-gray-600 mb-4">If you discover a security vulnerability in Virelix, please report it to us immediately at uzairwaseem390@gmail.com. We take all security reports seriously and will work to address the issue promptly.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Compliance</h2>
                        <p className="text-gray-600 mb-4">Virelix complies with industry standards and best practices for data protection and security. We are committed to maintaining the highest level of security for our users.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityPage;