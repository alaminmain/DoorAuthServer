import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/AuthService';
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

interface AuthContextType {
    user: User | null;
    login: () => void;
    logout: () => void;
    isAuthenticated: boolean;
    handleCallback: (code: string) => Promise<void>;
    handleSSOToken: (token: string) => boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('🔐 AuthProvider - Initializing...');
        const token = AuthService.getToken();
        console.log('🎫 AuthProvider - Token from storage:', token ? 'Found' : 'Not found');

        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                console.log('📝 AuthProvider - Decoded token:', decoded);

                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    console.warn('⏰ AuthProvider - Token expired');
                    AuthService.logout();
                    setUser(null);
                } else {
                    console.log('✅ AuthProvider - Token valid, setting user');
                    setUser(decoded);
                }
            } catch (e) {
                console.error('❌ AuthProvider - Invalid token', e);
                localStorage.removeItem('access_token');
            }
        } else {
            console.log('ℹ️ AuthProvider - No token found');
        }
        setIsLoading(false);
        console.log('🏁 AuthProvider - Initialization complete');
    }, []);

    const login = () => {
        console.log('🔑 AuthProvider - Login initiated');
        AuthService.login();
    };

    const logout = () => {
        console.log('👋 AuthProvider - Logout initiated');

        // Clear local token
        localStorage.removeItem('access_token');
        setUser(null);

        // Trigger logout event for other tabs
        localStorage.setItem('logout-event', Date.now().toString());

        // Redirect to DoorAuth server's end_session endpoint to clear server-side session
        // After server logout, it will redirect back to our login page
        const logoutUrl = new URL('https://localhost:3000/api/oauth/end_session');
        logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin + '/login');

        console.log('🔗 Redirecting to logout URL:', logoutUrl.toString());
        window.location.href = logoutUrl.toString();
    };

    // Listen for logout events from other tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'logout-event') {
                console.log('🔔 Logout event detected from another tab');
                // Clear local state
                AuthService.logout();
                setUser(null);
                // Redirect to login
                window.location.href = '/login';
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleCallback = async (code: string) => {
        setIsLoading(true);
        try {
            const token = await AuthService.handleCallback(code);
            const decoded = jwtDecode<User>(token);
            setUser(decoded);
        } catch (e) {
            console.error('Callback error', e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSSOToken = (token: string): boolean => {
        try {
            const decoded = jwtDecode<User>(token);

            // Check if token is expired
            if (decoded.exp * 1000 < Date.now()) {
                console.error('SSO token expired');
                return false;
            }

            // Store token
            localStorage.setItem('access_token', token);

            // Set user state
            setUser(decoded);

            return true;
        } catch (e) {
            console.error('Invalid SSO token', e);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            handleCallback,
            handleSSOToken,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
