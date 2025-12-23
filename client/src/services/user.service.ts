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
};
