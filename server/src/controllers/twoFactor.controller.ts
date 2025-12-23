import { Request, Response } from 'express';
import { TwoFactorService } from '../services/twoFactor.service';
import { ApiResponse } from '../utils/ApiResponse';

const twoFactorService = new TwoFactorService();

export class TwoFactorController {
    /**
     * Generate 2FA secret and QR code
     * Requires authentication
     */
    async generateSecret(req: Request, res: Response) {
        try {
            const user = (req as any).user; // Set by authMiddleware
            const result = await twoFactorService.generateSecret(user.userId, user.email);

            res.status(200).json(
                ApiResponse.success(result, '2FA secret generated. Scan the QR code with your authenticator app.')
            );
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Verify 2FA token and enable 2FA
     * Requires authentication
     */
    async verifyAndEnable(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const { token } = req.body;

            if (!token) {
                res.status(400).json(ApiResponse.error('Token is required'));
                return;
            }

            const result = await twoFactorService.verifyAndEnable(user.userId, token);
            res.status(200).json(ApiResponse.success(result, '2FA enabled successfully'));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Disable 2FA
     * Requires authentication and valid 2FA token
     */
    async disable(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const { token } = req.body;

            if (!token) {
                res.status(400).json(ApiResponse.error('Token is required'));
                return;
            }

            const result = await twoFactorService.disable(user.userId, token);
            res.status(200).json(ApiResponse.success(result, '2FA disabled successfully'));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }
}
