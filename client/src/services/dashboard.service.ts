import apiService from './api';
import type { DashboardStats } from '../types';

export const dashboardService = {
    async getStats(tenantId?: string): Promise<DashboardStats> {
        const url = tenantId ? `/dashboard/stats?tenantId=${tenantId}` : '/dashboard/stats';
        const response = await apiService.get<DashboardStats>(url);

        if (response.success && response.data) {
            return response.data;
        }
        throw new Error(response.message || 'Failed to load dashboard stats');
    }
};
