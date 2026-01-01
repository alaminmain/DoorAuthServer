import apiService from './api';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/login', credentials);
        if (response.success && response.data) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        }
        throw new Error(response.message || 'Login failed');
    },

    async register(data: RegisterData): Promise<User> {
        const response = await apiService.post<User>('/auth/register', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Registration failed');
    },

    async logout(): Promise<void> {
        try {
            // Step 1: Call server logout endpoint to clear server-side cookies
            await apiService.post('/auth/logout', {});
            console.log('[Logout] Server logout successful');
        } catch (error) {
            console.error('[Logout] Server logout failed:', error);
            // Continue with client-side cleanup even if server call fails
        }

        // Step 2: Clear localStorage tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('[Logout] localStorage cleared');

        // Step 3: Redirect to OIDC end_session endpoint for centralized logout
        // This ensures logout from the auth server itself and any SSO sessions
        const endSessionUrl = new URL('/api/oauth/end_session', window.location.origin);
        endSessionUrl.searchParams.append('post_logout_redirect_uri', window.location.origin + '/login');

        console.log('[Logout] Redirecting to end_session:', endSessionUrl.toString());
        window.location.href = endSessionUrl.toString();
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },
};
