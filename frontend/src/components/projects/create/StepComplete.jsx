import { useState } from 'react';
import ModuleBadge from '../ModuleBadge';

const StepComplete = ({ project, credentials, onOpenDashboard, onClose }) => {
    const [copiedField, setCopiedField] = useState(null);

    const copyToClipboard = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatCredentials = (type) => {
        const cred = credentials[type];
        return `Email: ${cred.email}\nPassword: ${cred.password}`;
    };

    return (
        <div className="space-y-6">
            {/* Success Message */}
            <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Your project is ready!
                </h3>
                <p className="text-gray-600">
                    AI has configured your ERP system based on your business needs
                </p>
            </div>

            {/* Modules */}
            {project.enabled_modules?.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Modules configured by AI:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {project.enabled_modules.map(module => (
                            <ModuleBadge key={module} module={module} size="md" />
                        ))}
                    </div>
                </div>
            )}

            {/* Credentials */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-2">
                    <h4 className="text-white text-sm font-mono">🔐 Team Credentials</h4>
                    <p className="text-gray-400 text-xs mt-1">
                        Save these now. You can change them later in project settings.
                    </p>
                </div>

                <div className="p-4 space-y-4">
                    {/* Manager */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-blue-400 font-mono text-sm">MANAGER</span>
                            <button
                                onClick={() => copyToClipboard(formatCredentials('manager'), 'manager')}
                                className="text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                {copiedField === 'manager' ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                        <div className="bg-black rounded p-3 font-mono text-sm text-green-400">
                            Email: {credentials.manager.email}<br />
                            Password: {credentials.manager.password}
                        </div>
                    </div>

                    {/* Staff */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-green-400 font-mono text-sm">STAFF</span>
                            <button
                                onClick={() => copyToClipboard(formatCredentials('staff'), 'staff')}
                                className="text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                {copiedField === 'staff' ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                        <div className="bg-black rounded p-3 font-mono text-sm text-green-400">
                            Email: {credentials.staff.email}<br />
                            Password: {credentials.staff.password}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={onOpenDashboard}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Open Project Dashboard
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    Go to Projects List
                </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-xs">
                    ⚠️ These credentials are shown only once. Make sure to save them securely.
                </p>
            </div>
        </div>
    );
};

export default StepComplete;