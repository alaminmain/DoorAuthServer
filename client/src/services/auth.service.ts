import apiService from './api';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types';

export const authService = {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await apiService.post<AuthResponse>('/auth/login', credentials);
        if (response.success && response.data) {
            console.log('[Auth Service] Login successful, storing tokens:', {
                hasToken: !!response.data.token,
                hasRefreshToken: !!response.data.refreshToken,
                hasSessionToken: !!response.data.sessionToken,
            });

            // Store access token
            localStorage.setItem('token', response.data.token);

            // Store session token if provided
            if (response.data.sessionToken) {
                localStorage.setItem('sessionToken', response.data.sessionToken);
            }

            // Store refresh token if provided (for future use)
            if (response.data.refreshToken) {
                localStorage.setItem('refreshToken', response.data.refreshToken);
            }

            // Store token expiry time (1 hour from now)
            const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour
            localStorage.setItem('tokenExpiry', expiryTime.toString());

            // Store user data
            localStorage.setItem('user', JSON.stringify(response.data.user));

            console.log('[Auth Service] Tokens stored in localStorage');

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
            // Step 1: Call server logout endpoint to clear server-side cookies and revoke sessions
            await apiService.post('/auth/logout', {});
            console.log('[Logout] Server logout successful');
        } catch (error) {
            console.error('[Logout] Server logout failed:', error);
            // Continue with client-side cleanup even if server call fails
        }

        // Step 2: Clear all localStorage tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('tokenExpiry');
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

    /**
     * Check if token is expired or about to expire
     */
    isTokenExpired(): boolean {
        const expiryTime = localStorage.getItem('tokenExpiry');
        if (!expiryTime) return true;

        const expiry = parseInt(expiryTime, 10);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        return now >= (expiry - fiveMinutes);
    },

    /**
     * Request a password reset email
     */
    async forgotPassword(email: string, tenantId: number = 1): Promise<{ message: string }> {
        const response = await apiService.post<{ message: string }>('/password/forgot-password', {
            email,
            tenantId,
        });
        if (response.success) {
            return response.data || { message: 'Reset email sent' };
        }
        throw new Error(response.message || 'Failed to send reset email');
    },

    /**
     * Reset password with token
     */
    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        const response = await apiService.post<{ message: string }>('/password/reset-password', {
            token,
            newPassword,
        });
        if (response.success) {
            return response.data || { message: 'Password reset successful' };
        }
        throw new Error(response.message || 'Password reset failed');
    },

    /**
     * Validate password reset token
     */
    async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
        const response = await apiService.get<{ valid: boolean; email?: string }>(`/password/validate-token?token=${token}`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Invalid or expired token');
    },

    // ==================== Email Verification ====================

    /**
     * Verify email with token (POST method for form submission)
     */
    async verifyEmail(token: string): Promise<{ message: string; verified: boolean }> {
        const response = await apiService.post<{ message: string; verified: boolean }>('/auth/verify-email', { token });
        if (response.success) {
            // Update local user data if verification successful
            const user = this.getCurrentUser();
            if (user) {
                user.emailVerified = true;
                localStorage.setItem('user', JSON.stringify(user));
            }
            return response.data || { message: 'Email verified successfully', verified: true };
        }
        throw new Error(response.message || 'Email verification failed');
    },

    /**
     * Verify email via link (GET method for direct link access)
     */
    async verifyEmailByLink(token: string): Promise<{ message: string; verified: boolean }> {
        const response = await apiService.get<{ message: string; verified: boolean }>(`/auth/verify-email/${token}`);
        if (response.success) {
            // Update local user data if verification successful
            const user = this.getCurrentUser();
            if (user) {
                user.emailVerified = true;
                localStorage.setItem('user', JSON.stringify(user));
            }
            return response.data || { message: 'Email verified successfully', verified: true };
        }
        throw new Error(response.message || 'Email verification failed');
    },

    /**
     * Resend verification email
     */
    async resendVerificationEmail(): Promise<{ message: string }> {
        const response = await apiService.post<{ message: string }>('/auth/resend-verification', {});
        if (response.success) {
            return response.data || { message: 'Verification email sent' };
        }
        throw new Error(response.message || 'Failed to send verification email');
    },

    /**
     * Get email verification status
     */
    async getVerificationStatus(): Promise<{ verified: boolean; email: string }> {
        const response = await apiService.get<{ verified: boolean; email: string }>('/auth/verification-status');
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to get verification status');
    },

    // ==================== Two-Factor Authentication (2FA) ====================

    /**
     * Generate TOTP secret and QR code for 2FA setup
     */
    async generate2FA(): Promise<{ secret: string; qrCode: string; otpauthUrl: string }> {
        const response = await apiService.post<{ secret: string; qrCode: string; otpauthUrl: string }>('/2fa/generate', {});
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to generate 2FA secret');
    },

    /**
     * Verify TOTP code and enable 2FA
     */
    async verify2FA(code: string): Promise<{ message: string; backupCodes?: string[] }> {
        const response = await apiService.post<{ message: string; backupCodes?: string[] }>('/2fa/verify', { code });
        if (response.success) {
            // Update local user data
            const user = this.getCurrentUser();
            if (user) {
                user.isTwoFactorEnabled = true;
                localStorage.setItem('user', JSON.stringify(user));
            }
            return response.data || { message: '2FA enabled successfully' };
        }
        throw new Error(response.message || '2FA verification failed');
    },

    /**
     * Disable 2FA with password confirmation
     */
    async disable2FA(password: string): Promise<{ message: string }> {
        const response = await apiService.post<{ message: string }>('/2fa/disable', { password });
        if (response.success) {
            // Update local user data
            const user = this.getCurrentUser();
            if (user) {
                user.isTwoFactorEnabled = false;
                localStorage.setItem('user', JSON.stringify(user));
            }
            return response.data || { message: '2FA disabled successfully' };
        }
        throw new Error(response.message || 'Failed to disable 2FA');
    },

    /**
     * Get 2FA status
     */
    async get2FAStatus(): Promise<{ enabled: boolean }> {
        const user = this.getCurrentUser();
        return { enabled: user?.isTwoFactorEnabled || false };
    },
};
