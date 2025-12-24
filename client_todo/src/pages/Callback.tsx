import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Callback() {
    const [searchParams] = useSearchParams();
    const { handleCallback } = useAuth();
    const navigate = useNavigate();
    const processed = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code && !processed.current) {
            processed.current = true;
            handleCallback(code)
                .then(() => navigate('/'))
                .catch((err) => {
                    console.error('Login failed', err);
                    navigate('/login');
                });
        } else if (!code) {
            navigate('/login');
        }
    }, [searchParams, handleCallback, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
}
