import apiService from './api';
import type { Menu, CreateMenuDto } from '../types';

export const menuService = {
    async getAll(applicationId?: string): Promise<Menu[]> {
        const url = applicationId ? `/menus?applicationId=${applicationId}` : '/menus';
        const response = await apiService.get<Menu[]>(url);
        return response.data || [];
    },

    async getById(id: string): Promise<Menu> {
        const response = await apiService.get<Menu>(`/menus/${id}`);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to fetch menu');
    },

    async create(data: CreateMenuDto): Promise<Menu> {
        const response = await apiService.post<Menu>('/menus', data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to create menu');
    },

    async update(id: string, data: Partial<CreateMenuDto>): Promise<Menu> {
        const response = await apiService.put<Menu>(`/menus/${id}`, data);
        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to update menu');
    },

    async delete(id: string): Promise<void> {
        const response = await apiService.delete(`/menus/${id}`);
        if (!response.success) {
            throw new Error(response.message || 'Failed to delete menu');
        }
    },

    async getSmartMenu(applicationId: string): Promise<Menu[]> {
        const response = await apiService.get<Menu[]>(`/menus/smart/${applicationId}`);
        return response.data || [];
    },
};
