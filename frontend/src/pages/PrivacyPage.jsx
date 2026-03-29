import { Link } from 'react-router-dom';

const PrivacyPage = () => {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">We collect information you provide directly to us, such as when you create an account, including your email address, password, and Gemini API key. Your API key is encrypted and stored securely.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">We use the information we collect to provide, maintain, and improve our services, including to:</p>
                        <ul className="list-disc list-inside text-gray-600 mb-4 ml-4">
                            <li>Process your account registration</li>
                            <li>Enable AI-powered features using your Gemini API key</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. Data Security</h2>
                        <p className="text-gray-600 mb-4">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All sensitive data is encrypted both in transit and at rest.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Data Sharing</h2>
                        <p className="text-gray-600 mb-4">We do not share your personal information with third parties except as described in this policy. Your Gemini API key is only used to make API calls to Google's Gemini AI service on your behalf.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Your Rights</h2>
                        <p className="text-gray-600 mb-4">You have the right to access, correct, or delete your personal information. You can do this through your account settings or by contacting us directly.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6. Contact Us</h2>
                        <p className="text-gray-600 mb-4">If you have any questions about this Privacy Policy, please contact us at: uzairwaseem390@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;