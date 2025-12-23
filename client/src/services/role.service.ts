import apiService from './api';
import type { Role, CreateRoleDto, Permission, CreatePermissionDto } from '../types';

export const roleService = {
    async getAll(tenantId?: string): Promise<Role[]> {
        const url = tenantId ? `/roles?tenantId=${tenantId}` : '/roles';
        const response = await apiService.get<Role[]>(url);
        return response.data || [];
    },

    async getById(id: string): Promise<Role> {
        const response = await apiService.get<Role>(`/roles/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch role');
    },

    async create(data: CreateRoleDto): Promise<Role> {
        const response = await apiService.post<Role>('/roles', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create role');
    },

    async update(id: string, data: Partial<CreateRoleDto>): Promise<Role> {
        const response = await apiService.put<Role>(`/roles/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update role');
    },

    async delete(id: string): Promise<void> {
        const response = await apiService.delete(`/roles/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete role');
        }
    },

    async getPermissions(roleId: string): Promise<Permission[]> {
        const response = await apiService.get<Permission[]>(`/roles/${roleId}/permissions`);
        return response.data || [];
    },

    async getAllPermissions(): Promise<Permission[]> {
        const response = await apiService.get<Permission[]>('/permissions');
        return response.data || [];
    },

    async addPermission(data: CreatePermissionDto): Promise<Permission> {
        const response = await apiService.post<Permission>('/permissions', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to add permission');
    },

    async deletePermission(id: string): Promise<void> {
        const response = await apiService.delete(`/permissions/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete permission');
        }
    },
};
