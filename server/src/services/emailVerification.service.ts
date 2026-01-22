import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export interface CreateVerificationOptions {
    userId: string;
    email: string;
    expiresInHours?: number; // Default: 24 hours
}

export class EmailVerificationService {
    /**
     * Create a new email verification token
     */
    async createVerification(options: CreateVerificationOptions): Promise<string> {
        try {
            // Generate secure random token
            const token = crypto.randomBytes(32).toString('hex');

            // Calculate expiration time
            const expiresInHours = options.expiresInHours || 24;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);

            // Delete any existing unverified tokens for this user
            await prisma.emailVerification.deleteMany({
                where: {
                    userId: options.userId,
                    verifiedAt: null,
                },
            });

            // Create new verification token
            await prisma.emailVerification.create({
                data: {
                    userId: options.userId,
                    email: options.email,
                    token,
                    expiresAt,
                },
            });

            Logger.info('Email verification token created', {
                userId: options.userId,
                email: options.email,
                token: token.substring(0, 10) + '...',
            });

            return token;
        } catch (error: any) {
            Logger.error('Failed to create email verification', {
                error: error.message,
                userId: options.userId,
            });
            throw new Error('Failed to create email verification');
        }
    }

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
        try {
            // Find verification record
            const verification = await prisma.emailVerification.findUnique({
                where: { token },
            });

            if (!verification) {
                return {
                    success: false,
                    message: 'Invalid verification token',
                };
            }

            // Check if already verified
            if (verification.verifiedAt) {
                return {
                    success: false,
                    message: 'Email already verified',
                };
            }

            // Check if expired
            if (verification.expiresAt < new Date()) {
                return {
                    success: false,
                    message: 'Verification token has expired',
                };
            }

            // Mark as verified
            await prisma.emailVerification.update({
                where: { token },
                data: { verifiedAt: new Date() },
            });

            // Update user's email verification status
            await prisma.user.update({
                where: { id: verification.userId },
                data: {
                    emailVerified: true,
                    emailVerifiedAt: new Date(),
                },
            });

            Logger.info('Email verified successfully', {
                userId: verification.userId,
                email: verification.email,
            });

            return {
                success: true,
                message: 'Email verified successfully',
                userId: verification.userId,
            };
        } catch (error: any) {
            Logger.error('Failed to verify email', {
                error: error.message,
                token: token.substring(0, 10) + '...',
            });
            return {
                success: false,
                message: 'Failed to verify email',
            };
        }
    }

    /**
     * Check if user's email is verified
     */
    async isEmailVerified(userId: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { emailVerified: true },
            });

            return user?.emailVerified || false;
        } catch (error: any) {
            Logger.error('Failed to check email verification status', {
                error: error.message,
                userId,
            });
            return false;
        }
    }

    /**
     * Resend verification email
     */
    async resendVerification(userId: string): Promise<string> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, emailVerified: true },
            });

            if (!user) {
                throw new Error('User not found');
            }

            if (user.emailVerified) {
                throw new Error('Email already verified');
            }

            // Create new verification token
            const token = await this.createVerification({
                userId,
                email: user.email,
            });

            Logger.info('Verification email resent', {
                userId,
                email: user.email,
            });

            return token;
        } catch (error: any) {
            Logger.error('Failed to resend verification', {
                error: error.message,
                userId,
            });
            throw error;
        }
    }

    /**
     * Clean up expired verification tokens
     * Should be run periodically (e.g., daily cron job)
     */
    async cleanupExpiredTokens(): Promise<number> {
        try {
            const result = await prisma.emailVerification.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                    verifiedAt: null, // Only delete unverified tokens
                },
            });

            Logger.info('Cleaned up expired verification tokens', {
                count: result.count,
            });

            return result.count;
        } catch (error: any) {
            Logger.error('Failed to cleanup expired tokens', {
                error: error.message,
            });
            throw new Error('Failed to cleanup expired tokens');
        }
    }

    /**
     * Get verification status for a user
     */
    async getVerificationStatus(userId: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    emailVerified: true,
                    emailVerifiedAt: true,
                    email: true,
                },
            });

            if (!user) {
                return null;
            }

            // Get pending verification if exists
            const pendingVerification = await prisma.emailVerification.findFirst({
                where: {
                    userId,
                    verifiedAt: null,
                    expiresAt: {
                        gt: new Date(),
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return {
                email: user.email,
                isVerified: user.emailVerified,
                verifiedAt: user.emailVerifiedAt,
                hasPendingVerification: !!pendingVerification,
                pendingVerificationExpiresAt: pendingVerification?.expiresAt,
            };
        } catch (error: any) {
            Logger.error('Failed to get verification status', {
                error: error.message,
                userId,
            });
            return null;
        }
    }

    /**
     * Generate verification URL
     */
    generateVerificationUrl(token: string, baseUrl: string): string {
        return `${baseUrl}/verify-email?token=${token}`;
    }

    /**
     * Send verification email (using Brevo email service)
     */
    async sendVerificationEmail(userId: string, baseUrl: string): Promise<void> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, userName: true },
            });

            if (!user) {
                throw new Error('User not found');
            }

            // Create verification token
            const token = await this.createVerification({
                userId,
                email: user.email,
            });

            // Generate verification URL
            const verificationUrl = this.generateVerificationUrl(token, baseUrl);

            // Send email using Brevo
            const { EmailService } = await import('./email.service');
            const emailService = new EmailService();

            await emailService.sendVerificationEmail(
                user.email,
                verificationUrl,
                user.userName || undefined
            );

            Logger.info('Verification email sent via Brevo', {
                userId,
                email: user.email,
            });
        } catch (error: any) {
            Logger.error('Failed to send verification email', {
                error: error.message,
                userId,
            });
            throw error;
        }
    }
}
