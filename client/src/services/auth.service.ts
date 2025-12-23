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

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
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
