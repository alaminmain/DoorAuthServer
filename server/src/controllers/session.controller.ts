import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const sessionService = new SessionService();

export class SessionController {
    /**
     * Get current user's sessions
     * GET /api/sessions/my
     */
    async getMySessions(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json(ApiResponse.error('Unauthorized'));
            }

            const sessions = await sessionService.getUserSessions(userId);

            res.status(200).json(
                ApiResponse.success(sessions, 'Sessions retrieved successfully')
            );
        } catch (error: any) {
            Logger.error('Failed to get user sessions', {
                error: error.message,
                userId: (req as any).user?.userId,
            });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get all active sessions (admin only)
     * GET /api/sessions
     */
    async getAllSessions(req: Request, res: Response) {
        try {
            // TODO: Add admin permission check
            const userId = req.query.userId as string;

            if (!userId) {
                return res.status(400).json(ApiResponse.error('userId is required'));
            }

            const sessions = await sessionService.getUserSessions(userId);

            res.status(200).json(
                ApiResponse.success(sessions, 'Sessions retrieved successfully')
            );
        } catch (error: any) {
            Logger.error('Failed to get sessions', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Revoke a specific session
     * DELETE /api/sessions/:sessionToken
     */
    async revokeSession(req: Request, res: Response) {
        try {
            const { sessionToken } = req.params;
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json(ApiResponse.error('Unauthorized'));
            }

            // Verify the session belongs to the user
            const session = await sessionService.getSessionByToken(sessionToken);

            if (!session) {
                return res.status(404).json(ApiResponse.error('Session not found'));
            }

            if (session.userId !== userId) {
                return res.status(403).json(ApiResponse.error('Forbidden'));
            }

            await sessionService.revokeSession(sessionToken, 'user_revoked');

            res.status(200).json(
                ApiResponse.success({}, 'Session revoked successfully')
            );
        } catch (error: any) {
            Logger.error('Failed to revoke session', {
                error: error.message,
                sessionToken: req.params.sessionToken,
            });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Revoke all user sessions
     * DELETE /api/sessions/my/all
     */
    async revokeAllMySessions(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json(ApiResponse.error('Unauthorized'));
            }

            const count = await sessionService.revokeAllUserSessions(
                userId,
                'user_revoked_all'
            );

            res.status(200).json(
                ApiResponse.success(
                    { count },
                    `${count} session(s) revoked successfully`
                )
            );
        } catch (error: any) {
            Logger.error('Failed to revoke all sessions', {
                error: error.message,
                userId: (req as any).user?.userId,
            });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get session statistics
     * GET /api/sessions/stats
     */
    async getSessionStats(req: Request, res: Response) {
        try {
            const stats = await sessionService.getSessionStats();

            res.status(200).json(
                ApiResponse.success(stats, 'Session statistics retrieved successfully')
            );
        } catch (error: any) {
            Logger.error('Failed to get session stats', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Admin: Revoke all sessions for a specific user
     * DELETE /api/sessions/user/:userId/all
     */
    async revokeAllUserSessions(req: Request, res: Response) {
        try {
            // TODO: Add admin permission check
            const { userId } = req.params;
            const reason = req.body.reason || 'admin_revoked';

            const count = await sessionService.revokeAllUserSessions(userId, reason);

            res.status(200).json(
                ApiResponse.success(
                    { count },
                    `${count} session(s) revoked successfully`
                )
            );
        } catch (error: any) {
            Logger.error('Failed to revoke user sessions', {
                error: error.message,
                userId: req.params.userId,
            });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
