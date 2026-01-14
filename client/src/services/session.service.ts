import apiService from './api';
import type { ApiResponse } from '../types';

export interface Session {
    id: string;
    sessionToken: string;
    deviceInfo: string | null;
    browser: string | null;
    os: string | null;
    ipAddress: string | null;
    loginTime: string;
    lastActivity: string;
    expiresAt: string;
    isActive: boolean;
}

export interface SessionStats {
    totalActive: number;
    totalExpired: number;
    totalRevoked: number;
    total: number;
}

class SessionService {
    /**
     * Get current user's active sessions
     */
    async getMySessions(): Promise<Session[]> {
        const response = await apiService.get<Session[]>('/sessions/my');
        return response.data || [];
    }

    /**
     * Revoke a specific session
     */
    async revokeSession(sessionToken: string): Promise<void> {
        await apiService.delete(`/sessions/${sessionToken}`);
    }

    /**
     * Revoke all current user's sessions
     */
    async revokeAllMySessions(): Promise<{ count: number }> {
        const response = await apiService.delete<{ count: number }>('/sessions/my/all');
        return response.data || { count: 0 };
    }

    /**
     * Get session statistics (admin)
     */
    async getSessionStats(): Promise<SessionStats> {
        const response = await apiService.get<SessionStats>('/sessions/stats');
        return response.data || { totalActive: 0, totalExpired: 0, totalRevoked: 0, total: 0 };
    }

    /**
     * Admin: Get sessions for a specific user
     */
    async getUserSessions(userId: string): Promise<Session[]> {
        const response = await apiService.get<Session[]>(`/sessions?userId=${userId}`);
        return response.data || [];
    }

    /**
     * Admin: Revoke all sessions for a specific user
     */
    async revokeAllUserSessions(userId: string, reason?: string): Promise<{ count: number }> {
        const response = await apiService.delete<{ count: number }>(`/sessions/user/${userId}/all`, {
            reason,
        });
        return response.data || { count: 0 };
    }
}

export const sessionService = new SessionService();
export default sessionService;
