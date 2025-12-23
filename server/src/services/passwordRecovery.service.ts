import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { EmailService } from './email.service';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();
const emailService = new EmailService();
const SALT_ROUNDS = 10;

export class PasswordRecoveryService {
    /**
     * Generate a password reset token and send email
     */
    async forgotPassword(email: string, tenantId: string) {
        Logger.info('Password reset requested', email);

        // Find user
        const user = await prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId,
                    email,
                },
            },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            Logger.warn('Password reset requested for non-existent user', email);
            return { message: 'If the email exists, a password reset link has been sent.' };
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expiration to 1 hour from now
        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);

        // Deactivate any existing tokens for this user
        await prisma.passToken.updateMany({
            where: {
                userId: user.id,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });

        // Create new password reset token
        await prisma.passToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                remarks: 'Password Reset',
                isActive: true,
                expireDate,
            },
        });

        // Send email
        try {
            await emailService.sendPasswordResetEmail(email, resetToken, user.userName || undefined);
            Logger.info('Password reset email sent', email);
        } catch (error) {
            Logger.error('Failed to send password reset email', error);
            throw new Error('Failed to send password reset email');
        }

        return { message: 'If the email exists, a password reset link has been sent.' };
    }

    /**
     * Verify reset token and update password
     */
    async resetPassword(token: string, newPassword: string) {
        Logger.info('Password reset attempt with token');

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find valid token
        const passToken = await prisma.passToken.findFirst({
            where: {
                token: hashedToken,
                isActive: true,
                expireDate: {
                    gte: new Date(), // Token must not be expired
                },
                tokenUsedDate: null, // Token must not have been used
            },
            include: {
                user: true,
            },
        });

        if (!passToken) {
            throw new Error('Invalid or expired reset token');
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update user password
        await prisma.user.update({
            where: { id: passToken.userId },
            data: {
                passwordHash,
                passAttemptCount: 0, // Reset failed login attempts
                isLocked: false, // Unlock account if it was locked
            },
        });

        // Mark token as used
        await prisma.passToken.update({
            where: { id: passToken.id },
            data: {
                isActive: false,
                tokenUsedDate: new Date(),
            },
        });

        Logger.info('Password reset successful', { userId: passToken.userId });

        return { message: 'Password reset successful. You can now login with your new password.' };
    }

    /**
     * Validate reset token (without resetting password)
     */
    async validateResetToken(token: string) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const passToken = await prisma.passToken.findFirst({
            where: {
                token: hashedToken,
                isActive: true,
                expireDate: {
                    gte: new Date(),
                },
                tokenUsedDate: null,
            },
        });

        if (!passToken) {
            throw new Error('Invalid or expired reset token');
        }

        return { valid: true, message: 'Token is valid' };
    }
}
