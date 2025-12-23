import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class AccountSecurityController {
    /**
     * Unlock a locked user account (Admin only)
     */
    async unlockAccount(req: Request, res: Response) {
        try {
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json(ApiResponse.error('userId is required'));
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                res.status(404).json(ApiResponse.error('User not found'));
                return;
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    isLocked: false,
                    passAttemptCount: 0,
                },
            });

            Logger.info('Account unlocked', { userId, unlockedBy: (req as any).user?.userId });

            res.status(200).json(
                ApiResponse.success(
                    { userId, email: user.email },
                    'Account unlocked successfully'
                )
            );
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get account security status
     */
    async getAccountStatus(req: Request, res: Response) {
        try {
            const user = (req as any).user;

            const userRecord = await prisma.user.findUnique({
                where: { id: user.userId },
                select: {
                    id: true,
                    email: true,
                    isLocked: true,
                    isApproved: true,
                    passAttemptCount: true,
                    lastLoginTime: true,
                    isTwoFactorEnabled: true,
                },
            });

            if (!userRecord) {
                res.status(404).json(ApiResponse.error('User not found'));
                return;
            }

            const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');

            res.status(200).json(
                ApiResponse.success({
                    ...userRecord,
                    remainingAttempts: Math.max(0, maxAttempts - userRecord.passAttemptCount),
                    maxAttempts,
                })
            );
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Reset failed login attempts (Admin only)
     */
    async resetAttempts(req: Request, res: Response) {
        try {
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json(ApiResponse.error('userId is required'));
                return;
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    passAttemptCount: 0,
                },
            });

            Logger.info('Login attempts reset', { userId, resetBy: (req as any).user?.userId });

            res.status(200).json(ApiResponse.success({ userId }, 'Login attempts reset successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
