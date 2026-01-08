import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export interface BlacklistTokenOptions {
    jti: string;
    userId: string;
    tokenType: 'access' | 'refresh' | 'id';
    expiresAt: Date;
    reason?: 'logout' | 'security' | 'admin' | 'password_change' | 'account_locked';
    revokedBy?: string;
    ipAddress?: string;
    userAgent?: string;
    token?: string; // Optional: store hashed token for additional verification
}

export class TokenBlacklistService {
    /**
     * Add a token to the blacklist
     */
    async blacklistToken(options: BlacklistTokenOptions): Promise<void> {
        try {
            // Hash the token if provided (for additional security)
            const hashedToken = options.token
                ? crypto.createHash('sha256').update(options.token).digest('hex')
                : undefined;

            await prisma.tokenBlacklist.create({
                data: {
                    jti: options.jti,
                    userId: options.userId,
                    tokenType: options.tokenType,
                    token: hashedToken,
                    expiresAt: options.expiresAt,
                    reason: options.reason || 'logout',
                    revokedBy: options.revokedBy,
                    ipAddress: options.ipAddress,
                    userAgent: options.userAgent,
                },
            });

            Logger.info('Token blacklisted', {
                jti: options.jti,
                userId: options.userId,
                tokenType: options.tokenType,
                reason: options.reason,
            });
        } catch (error: any) {
            Logger.error('Failed to blacklist token', {
                error: error.message,
                jti: options.jti,
            });
            throw new Error('Failed to blacklist token');
        }
    }

    /**
     * Check if a token is blacklisted by JTI
     */
    async isTokenBlacklisted(jti: string): Promise<boolean> {
        try {
            const blacklisted = await prisma.tokenBlacklist.findUnique({
                where: { jti },
            });

            return !!blacklisted;
        } catch (error: any) {
            Logger.error('Failed to check token blacklist', {
                error: error.message,
                jti,
            });
            // Fail secure: if we can't check, assume it's blacklisted
            return true;
        }
    }

    /**
     * Revoke all tokens for a user
     */
    async revokeAllUserTokens(
        userId: string,
        reason: 'security' | 'admin' | 'password_change' | 'account_locked',
        revokedBy?: string
    ): Promise<number> {
        try {
            // This is a placeholder - in a real implementation, you would:
            // 1. Get all active sessions for the user
            // 2. Extract JTIs from those sessions
            // 3. Blacklist each token

            // For now, we'll just log the action
            Logger.warn('Revoking all user tokens', {
                userId,
                reason,
                revokedBy,
            });

            // TODO: Implement actual token revocation
            // This requires session management to be implemented first

            return 0;
        } catch (error: any) {
            Logger.error('Failed to revoke user tokens', {
                error: error.message,
                userId,
            });
            throw new Error('Failed to revoke user tokens');
        }
    }

    /**
     * Clean up expired blacklist entries
     * Should be run periodically (e.g., daily cron job)
     */
    async cleanupExpiredEntries(): Promise<number> {
        try {
            const result = await prisma.tokenBlacklist.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(), // Less than current time = expired
                    },
                },
            });

            Logger.info('Cleaned up expired blacklist entries', {
                count: result.count,
            });

            return result.count;
        } catch (error: any) {
            Logger.error('Failed to cleanup blacklist', {
                error: error.message,
            });
            throw new Error('Failed to cleanup blacklist');
        }
    }

    /**
     * Get all blacklisted tokens for a user
     */
    async getUserBlacklistedTokens(userId: string) {
        try {
            return await prisma.tokenBlacklist.findMany({
                where: { userId },
                orderBy: { revokedAt: 'desc' },
                select: {
                    id: true,
                    jti: true,
                    tokenType: true,
                    revokedAt: true,
                    reason: true,
                    ipAddress: true,
                    userAgent: true,
                    expiresAt: true,
                },
            });
        } catch (error: any) {
            Logger.error('Failed to get user blacklisted tokens', {
                error: error.message,
                userId,
            });
            throw new Error('Failed to get blacklisted tokens');
        }
    }

    /**
     * Get blacklist statistics
     */
    async getBlacklistStats() {
        try {
            const total = await prisma.tokenBlacklist.count();
            const byType = await prisma.tokenBlacklist.groupBy({
                by: ['tokenType'],
                _count: true,
            });
            const byReason = await prisma.tokenBlacklist.groupBy({
                by: ['reason'],
                _count: true,
            });

            return {
                total,
                byType,
                byReason,
            };
        } catch (error: any) {
            Logger.error('Failed to get blacklist stats', {
                error: error.message,
            });
            throw new Error('Failed to get blacklist stats');
        }
    }

    /**
     * Revoke a specific token by JTI
     */
    async revokeToken(
        jti: string,
        userId: string,
        tokenType: 'access' | 'refresh' | 'id',
        expiresAt: Date,
        reason?: string,
        revokedBy?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.blacklistToken({
            jti,
            userId,
            tokenType,
            expiresAt,
            reason: (reason as any) || 'logout',
            revokedBy,
            ipAddress,
            userAgent,
        });
    }
}
