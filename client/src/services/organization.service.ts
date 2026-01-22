import api from './api';
import type { Organization, CreateOrganizationDto, UpdateOrganizationDto, ApiResponse } from '../types';

export const organizationService = {
    async getAll(): Promise<Organization[]> {
        const response = await api.get<ApiResponse<Organization[]>>('/organizations');
        return response.data.data || [];
    },

    async getById(id: string): Promise<Organization> {
        const response = await api.get<ApiResponse<Organization>>(`/organizations/${id}`);
        return response.data.data!;
    },

    async getTree(id: string): Promise<Organization> {
        const response = await api.get<ApiResponse<Organization>>(`/organizations/${id}/tree`);
        return response.data.data!;
    },

    async create(data: CreateOrganizationDto): Promise<Organization> {
        const response = await api.post<ApiResponse<Organization>>('/organizations', data);
        return response.data.data!;
    },

    async update(id: string, data: UpdateOrganizationDto): Promise<Organization> {
        const response = await api.put<ApiResponse<Organization>>(`/organizations/${id}`, data);
        return response.data.data!;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/organizations/${id}`);
    },

    async getUsersByOrganization(id: string): Promise<any[]> {
        const response = await api.get<ApiResponse<any[]>>(`/organizations/${id}/users`);
        return response.data.data || [];
    },

    async assignUser(organizationId: string, userId: string): Promise<any> {
        const response = await api.post<ApiResponse<any>>(`/organizations/${organizationId}/users`, { userId });
        return response.data.data!;
    },

    async removeUser(userId: string): Promise<any> {
        const response = await api.delete<ApiResponse<any>>(`/organizations/users/${userId}`);
        return response.data.data!;
    }
};
