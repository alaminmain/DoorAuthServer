import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface User {
    userId: string;
    email: string;
    tenantId: string;
    sub?: string;
    name?: string;
    exp: number;
    roles?: string[];
    permissions?: string[];
}

export default function SSOHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Processing SSO authentication...');

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            try {
                setStatus('Validating token...');

                // Decode and validate token
                const decoded = jwtDecode<User>(token);

                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    setError('SSO token has expired. Please login again from the portal.');
                    setTimeout(() => {
                        window.location.href = 'https://localhost:7140'; // Redirect to portal
                    }, 3000);
                    return;
                }

                setStatus('Token validated. Logging you in...');

                // Store token in localStorage
                localStorage.setItem('access_token', token);

                // Clean URL (remove token from address bar for security)
                window.history.replaceState({}, document.title, '/');

                // Redirect to dashboard
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 500);

            } catch (err) {
                console.error('SSO token validation error:', err);
                setError('Invalid SSO token. Please login again from the portal.');
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 3000);
            }
        } else {
            setError('No SSO token provided. Redirecting to login...');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="text-center">
                    {!error ? (
                        <>
                            <div className="mb-4">
                                <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">SSO Login</h2>
                            <p className="text-gray-600">{status}</p>
                        </>
                    ) : (
                        <>
                            <div className="mb-4">
                                <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h2>
                            <p className="text-gray-700">{error}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
