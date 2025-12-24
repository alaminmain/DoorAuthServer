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
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = AuthService.getToken();
        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    AuthService.logout();
                    setUser(null);
                } else {
                    setUser(decoded);
                }
            } catch (e) {
                console.error('Invalid token', e);
                localStorage.removeItem('access_token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = () => {
        AuthService.login();
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
    };

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

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            handleCallback,
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
