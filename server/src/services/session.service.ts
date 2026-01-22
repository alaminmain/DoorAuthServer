import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Logger } from '../utils/Logger';
import { UAParser } from 'ua-parser-js';

const prisma = new PrismaClient();

export interface CreateSessionOptions {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    expiresInHours?: number; // Default: 24 hours
}

export interface SessionInfo {
    id: string;
    sessionToken: string;
    deviceInfo: string | null;
    browser: string | null;
    os: string | null;
    ipAddress: string | null;
    loginTime: Date;
    lastActivity: Date;
    expiresAt: Date;
    isActive: boolean;
}

export class SessionService {
    /**
     * Create a new session for a user
     */
    async createSession(options: CreateSessionOptions): Promise<string> {
        try {
            // Generate unique session token
            const sessionToken = crypto.randomBytes(32).toString('hex');

            // Parse user agent to extract device info
            const parser = new UAParser();
            const result = parser.setUA(options.userAgent || '').getResult();

            const deviceInfo = result.device.model || result.device.type || 'Unknown Device';
            const browser = result.browser.name ? `${result.browser.name} ${result.browser.version}` : null;
            const os = result.os.name ? `${result.os.name} ${result.os.version}` : null;

            // Calculate expiration time
            const expiresInHours = options.expiresInHours || 24;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);

            // Create session in database
            await prisma.session.create({
                data: {
                    userId: options.userId,
                    sessionToken,
                    deviceInfo,
                    browser,
                    os,
                    ipAddress: options.ipAddress,
                    expiresAt,
                    isActive: true,
                },
            });

            Logger.info('Session created', {
                userId: options.userId,
                sessionToken: sessionToken.substring(0, 10) + '...',
                browser,
                os,
                ipAddress: options.ipAddress,
            });

            return sessionToken;
        } catch (error: any) {
            Logger.error('Failed to create session', {
                error: error.message,
                userId: options.userId,
            });
            throw new Error('Failed to create session');
        }
    }

    /**
     * Validate and update session activity
     */
    async validateSession(sessionToken: string): Promise<boolean> {
        try {
            const session = await prisma.session.findUnique({
                where: { sessionToken },
            });

            if (!session) {
                return false;
            }

            // Check if session is active
            if (!session.isActive) {
                return false;
            }

            // Check if session has expired
            if (session.expiresAt < new Date()) {
                // Auto-revoke expired session
                await this.revokeSession(sessionToken, 'expired');
                return false;
            }

            // Update last activity
            await prisma.session.update({
                where: { sessionToken },
                data: { lastActivity: new Date() },
            });

            return true;
        } catch (error: any) {
            Logger.error('Failed to validate session', {
                error: error.message,
                sessionToken: sessionToken.substring(0, 10) + '...',
            });
            return false;
        }
    }

    /**
     * Get all active sessions for a user
     */
    async getUserSessions(userId: string): Promise<SessionInfo[]> {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date(), // Greater than current time
                    },
                },
                orderBy: { lastActivity: 'desc' },
            });

            return sessions.map(session => ({
                id: session.id,
                sessionToken: session.sessionToken,
                deviceInfo: session.deviceInfo,
                browser: session.browser,
                os: session.os,
                ipAddress: session.ipAddress,
                loginTime: session.loginTime,
                lastActivity: session.lastActivity,
                expiresAt: session.expiresAt,
                isActive: session.isActive,
            }));
        } catch (error: any) {
            Logger.error('Failed to get user sessions', {
                error: error.message,
                userId,
            });
            throw new Error('Failed to get user sessions');
        }
    }

    /**
     * Revoke a specific session
     */
    async revokeSession(sessionToken: string, reason?: string): Promise<void> {
        try {
            await prisma.session.update({
                where: { sessionToken },
                data: {
                    isActive: false,
                    revokedAt: new Date(),
                    revokeReason: reason || 'manual',
                },
            });

            Logger.info('Session revoked', {
                sessionToken: sessionToken.substring(0, 10) + '...',
                reason,
            });
        } catch (error: any) {
            Logger.error('Failed to revoke session', {
                error: error.message,
                sessionToken: sessionToken.substring(0, 10) + '...',
            });
            throw new Error('Failed to revoke session');
        }
    }

    /**
     * Revoke all sessions for a user
     */
    async revokeAllUserSessions(userId: string, reason?: string): Promise<number> {
        try {
            const result = await prisma.session.updateMany({
                where: {
                    userId,
                    isActive: true,
                },
                data: {
                    isActive: false,
                    revokedAt: new Date(),
                    revokeReason: reason || 'revoke_all',
                },
            });

            Logger.info('All user sessions revoked', {
                userId,
                count: result.count,
                reason,
            });

            return result.count;
        } catch (error: any) {
            Logger.error('Failed to revoke all user sessions', {
                error: error.message,
                userId,
            });
            throw new Error('Failed to revoke all user sessions');
        }
    }

    /**
     * Clean up expired sessions
     * Should be run periodically (e.g., daily cron job)
     */
    async cleanupExpiredSessions(): Promise<number> {
        try {
            const result = await prisma.session.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(), // Less than current time
                    },
                },
            });

            Logger.info('Cleaned up expired sessions', {
                count: result.count,
            });

            return result.count;
        } catch (error: any) {
            Logger.error('Failed to cleanup expired sessions', {
                error: error.message,
            });
            throw new Error('Failed to cleanup expired sessions');
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStats() {
        try {
            const totalActive = await prisma.session.count({
                where: {
                    isActive: true,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
            });

            const totalExpired = await prisma.session.count({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });

            const totalRevoked = await prisma.session.count({
                where: {
                    isActive: false,
                    revokedAt: {
                        not: null,
                    },
                },
            });

            return {
                totalActive,
                totalExpired,
                totalRevoked,
                total: totalActive + totalExpired + totalRevoked,
            };
        } catch (error: any) {
            Logger.error('Failed to get session stats', {
                error: error.message,
            });
            throw new Error('Failed to get session stats');
        }
    }

    /**
     * Get session by token
     */
    async getSessionByToken(sessionToken: string) {
        try {
            return await prisma.session.findUnique({
                where: { sessionToken },
                include: {
                    user: {
                        select: {
                            id: true,
                            userName: true,
                            email: true,
                            tenantId: true,
                        },
                    },
                },
            });
        } catch (error: any) {
            Logger.error('Failed to get session by token', {
                error: error.message,
            });
            return null;
        }
    }
}
