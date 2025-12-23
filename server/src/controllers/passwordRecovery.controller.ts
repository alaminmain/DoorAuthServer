import { Request, Response } from 'express';
import { PasswordRecoveryService } from '../services/passwordRecovery.service';
import { ApiResponse } from '../utils/ApiResponse';

const passwordRecoveryService = new PasswordRecoveryService();

export class PasswordRecoveryController {
    /**
     * Request password reset
     */
    async forgotPassword(req: Request, res: Response) {
        try {
            const { email, tenantId } = req.body;

            if (!email || !tenantId) {
                res.status(400).json(ApiResponse.error('Email and tenantId are required'));
                return;
            }

            const result = await passwordRecoveryService.forgotPassword(email, tenantId);
            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(req: Request, res: Response) {
        try {
            const { token, newPassword } = req.body;

            if (!token || !newPassword) {
                res.status(400).json(ApiResponse.error('Token and new password are required'));
                return;
            }

            if (newPassword.length < 8) {
                res.status(400).json(ApiResponse.error('Password must be at least 8 characters long'));
                return;
            }

            const result = await passwordRecoveryService.resetPassword(token, newPassword);
            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Validate reset token
     */
    async validateToken(req: Request, res: Response) {
        try {
            const { token } = req.query;

            if (!token || typeof token !== 'string') {
                res.status(400).json(ApiResponse.error('Token is required'));
                return;
            }

            const result = await passwordRecoveryService.validateResetToken(token);
            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }
}
