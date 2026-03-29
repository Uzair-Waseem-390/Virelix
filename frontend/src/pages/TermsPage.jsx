import { Link } from 'react-router-dom';

const TermsPage = () => {
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Acceptance of Terms</h2>
                        <p className="text-gray-600 mb-4">By accessing or using Virelix, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. Account Registration</h2>
                        <p className="text-gray-600 mb-4">To use Virelix, you must register for an account. You agree to provide accurate and complete information and to keep this information updated. You are responsible for safeguarding your password and for all activities that occur under your account.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. API Key Usage</h2>
                        <p className="text-gray-600 mb-4">When you provide your Gemini API key, you grant us permission to use it solely for the purpose of providing AI-powered features within Virelix. You are responsible for complying with Google's terms of service for Gemini API usage.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Acceptable Use</h2>
                        <p className="text-gray-600 mb-4">You agree not to:</p>
                        <ul className="list-disc list-inside text-gray-600 mb-4 ml-4">
                            <li>Use the service for any illegal purpose</li>
                            <li>Attempt to gain unauthorized access to the service</li>
                            <li>Interfere with or disrupt the service or servers</li>
                            <li>Use the service to transmit malicious code</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Data Ownership</h2>
                        <p className="text-gray-600 mb-4">You retain all ownership rights to your data. Virelix does not claim ownership over any data you submit or generate through the service.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6. Termination</h2>
                        <p className="text-gray-600 mb-4">We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or the service.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7. Limitation of Liability</h2>
                        <p className="text-gray-600 mb-4">Virelix is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">8. Changes to Terms</h2>
                        <p className="text-gray-600 mb-4">We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new terms on this page.</p>

                        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9. Contact</h2>
                        <p className="text-gray-600 mb-4">For any questions about these Terms, please contact us at: uzairwaseem390@gmail.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;