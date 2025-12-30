import { ExternalLink, Info } from 'lucide-react';
import { useEffect } from 'react';

export default function Login() {
    useEffect(() => {
        console.log('🔓 Login page mounted');
    }, []);

    console.log('🎨 Login page rendering');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Todo App</h1>
                    <p className="text-gray-500">Access via SSO Portal</p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <Info size={24} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">SSO Portal Required</h3>
                            <p className="text-sm text-blue-700 mb-3">
                                This application uses Single Sign-On (SSO) authentication.
                                Please login through the DoorAuthSample portal to access this app.
                            </p>
                        </div>
                    </div>

                    <a
                        href="https://localhost:7140"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <ExternalLink size={20} />
                        Open SSO Portal
                    </a>
                </div>

                <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">How to Access:</h4>
                    <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                        <li>Click "Open SSO Portal" above</li>
                        <li>Login with your credentials</li>
                        <li>Click the "Todo App" card</li>
                        <li>You'll be automatically logged in!</li>
                    </ol>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                        <strong>Note:</strong> Direct OAuth login is not available.
                        All authentication is handled through the SSO portal.
                    </p>
                </div>
            </div>
        </div>
    );
}
