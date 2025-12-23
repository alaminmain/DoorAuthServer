import apiService from './api';
import type { Application, CreateApplicationDto } from '../types';

export const applicationService = {
    async getAll(tenantId?: string): Promise<Application[]> {
        const url = tenantId ? `/applications?tenantId=${tenantId}` : '/applications';
        const response = await apiService.get<Application[]>(url);
        return response.data || [];
    },

    async getById(id: string): Promise<Application> {
        const response = await apiService.get<Application>(`/applications/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch application');
    },

    async create(data: CreateApplicationDto): Promise<Application> {
        const response = await apiService.post<Application>('/applications', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create application');
    },

    async update(id: string, data: Partial<CreateApplicationDto>): Promise<Application> {
        const response = await apiService.put<Application>(`/applications/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update application');
    },

    async delete(id: string): Promise<void> {
        const response = await apiService.delete(`/applications/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete application');
        }
    },

    async regenerateSecret(id: string): Promise<{ clientSecret: string }> {
        const response = await apiService.post<{ clientSecret: string }>(`/applications/${id}/regenerate-secret`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to regenerate secret');
    },
};
