import apiService from './api';
import type { Tenant, CreateTenantDto } from '../types';

export const tenantService = {
    async getAll(): Promise<Tenant[]> {
        const response = await apiService.get<Tenant[]>('/tenants');
        return response.data || [];
    },

    async getById(id: string): Promise<Tenant> {
        const response = await apiService.get<Tenant>(`/tenants/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch tenant');
    },

    async create(data: CreateTenantDto): Promise<Tenant> {
        const response = await apiService.post<Tenant>('/tenants', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create tenant');
    },

    async update(id: string, data: Partial<CreateTenantDto>): Promise<Tenant> {
        const response = await apiService.put<Tenant>(`/tenants/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update tenant');
    },

    async delete(id: string): Promise<void> {
        const response = await apiService.delete(`/tenants/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete tenant');
        }
    },
};
