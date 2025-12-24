import apiService from './api';
import type { User, RegisterData } from '../types';

export const userService = {
    async getAll(tenantId?: string): Promise<User[]> {
        const url = tenantId ? `/users?tenantId=${tenantId}` : '/users';
        const response = await apiService.get<User[]>(url);
        return response.data || [];
    },

    async getById(id: string): Promise<User> {
        const response = await apiService.get<User>(`/users/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch user');
    },

    async create(data: RegisterData): Promise<User> {
        const response = await apiService.post<User>('/auth/register', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create user');
    },

    async update(id: string, data: Partial<User>): Promise<User> {
        const response = await apiService.put<User>(`/users/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update user');
    },

    async delete(id: string): Promise<void> {
        const response = await apiService.delete(`/users/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete user');
        }
    },

    async resetPassword(id: string, newPassword: string): Promise<void> {
        const response = await apiService.post(`/users/${id}/reset-password`, { newPassword });
        if (!response.success) {
            throw new Error(response.message || 'Failed to reset password');
        }
    },

    async sendResetPasswordLink(id: string, email: string): Promise<void> {
        const response = await apiService.post(`/users/${id}/send-reset-link`, { email });
        if (!response.success) {
            throw new Error(response.message || 'Failed to send reset link');
        }
    },

    async changeLockStatus(id: string, isLocked: boolean): Promise<User> {
        const response = await apiService.put<User>(`/users/${id}/lock-status`, { isLocked });
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update lock status');
    },

    async getActivityLogs(id: string): Promise<any[]> {
        const response = await apiService.get<any[]>(`/users/${id}/activity-logs`);
        return response.data || [];
    },
};
