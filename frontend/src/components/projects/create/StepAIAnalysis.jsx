import { useState, useEffect } from 'react';

const StepAIAnalysis = ({ status, error, onRetry }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    const messages = [
        "Reading your business requirements...",
        "Identifying required ERP modules...",
        "Configuring your workspace...",
        "Setting up team credentials...",
        "Almost done..."
    ];

    useEffect(() => {
        if (status === 'processing') {
            const interval = setInterval(() => {
                setMessageIndex((prev) => (prev + 1) % messages.length);
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [status]);

    if (status === 'failed') {
        return (
            <div className="text-center space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">AI Analysis Failed</h3>
                    <p className="text-red-600 mb-4">{error || 'An error occurred during analysis'}</p>
                    <button
                        onClick={onRetry}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center space-y-8">
            <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="relative pt-12">
                    <div className="text-6xl animate-bounce">🤖</div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI is analyzing your business
                </h3>
                <p className="text-gray-600 animate-pulse">
                    {messages[messageIndex]}
                </p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full animate-pulse"
                    style={{ width: '100%' }}
                ></div>
            </div>

            <p className="text-sm text-gray-500">
                This usually takes 10-20 seconds
            </p>
        </div>
    );
};

export default StepAIAnalysis;