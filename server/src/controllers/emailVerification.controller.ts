import { Request, Response } from 'express';
import { EmailVerificationService } from '../services/emailVerification.service';
import { ApiResponse } from '../utils/ApiResponse';

const emailVerificationService = new EmailVerificationService();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class EmailVerificationController {
    /**
     * Verify email with token
     * POST /api/auth/verify-email
     */
    async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json(ApiResponse.error('Verification token is required'));
            }

            const result = await emailVerificationService.verifyEmail(token);

            if (result.success) {
                res.status(200).json(ApiResponse.success({ userId: result.userId }, result.message));
            } else {
                res.status(400).json(ApiResponse.error(result.message));
            }
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Resend verification email
     * POST /api/auth/resend-verification
     */
    async resendVerification(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json(ApiResponse.error('Unauthorized'));
            }

            await emailVerificationService.sendVerificationEmail(userId, BASE_URL);

            res.status(200).json(ApiResponse.success(null, 'Verification email sent successfully'));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get verification status
     * GET /api/auth/verification-status
     */
    async getVerificationStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(401).json(ApiResponse.error('Unauthorized'));
            }

            const status = await emailVerificationService.getVerificationStatus(userId);

            if (!status) {
                return res.status(404).json(ApiResponse.error('User not found'));
            }

            res.status(200).json(ApiResponse.success(status));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Verify email via GET request (for email links)
     * GET /api/auth/verify-email/:token
     */
    async verifyEmailViaLink(req: Request, res: Response) {
        try {
            const { token } = req.params;

            const result = await emailVerificationService.verifyEmail(token);

            if (result.success) {
                // Redirect to success page
                res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/email-verified?success=true`);
            } else {
                // Redirect to error page
                res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/email-verified?success=false&message=${encodeURIComponent(result.message)}`);
            }
        } catch (error: any) {
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/email-verified?success=false&message=An error occurred`);
        }
    }
}
