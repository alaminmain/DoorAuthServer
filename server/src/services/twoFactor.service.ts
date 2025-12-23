import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class TwoFactorService {
    /**
     * Generate a new 2FA secret for a user
     * Returns the secret and QR code data URL
     */
    async generateSecret(userId: string, userEmail: string) {
        Logger.info('Generating 2FA secret for user', userId);

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `DoorAuthServer (${userEmail})`,
            issuer: 'DoorAuthServer',
            length: 32,
        });

        // Generate QR Code as Data URL
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

        // Store the secret in the database (but don't enable 2FA yet)
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret.base32,
                isTwoFactorEnabled: false, // User must verify first
            },
        });

        return {
            secret: secret.base32,
            qrCode: qrCodeDataUrl,
            otpauthUrl: secret.otpauth_url,
        };
    }

    /**
     * Verify a TOTP token and enable 2FA if valid
     */
    async verifyAndEnable(userId: string, token: string) {
        Logger.info('Verifying 2FA token for user', userId);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, isTwoFactorEnabled: true },
        });

        if (!user || !user.twoFactorSecret) {
            throw new Error('2FA secret not found. Please generate a secret first.');
        }

        // Verify the token
        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps before/after for clock drift
        });

        if (!isValid) {
            throw new Error('Invalid 2FA token');
        }

        // Enable 2FA for the user
        await prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true },
        });

        Logger.info('2FA enabled successfully for user', userId);

        return { message: '2FA enabled successfully' };
    }

    /**
     * Verify a TOTP token during login
     */
    async verifyToken(userId: string, token: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, isTwoFactorEnabled: true },
        });

        if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
            return false;
        }

        return speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2,
        });
    }

    /**
     * Disable 2FA for a user
     */
    async disable(userId: string, token: string) {
        Logger.info('Disabling 2FA for user', userId);

        // Verify token before disabling
        const isValid = await this.verifyToken(userId, token);
        if (!isValid) {
            throw new Error('Invalid 2FA token. Cannot disable 2FA.');
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });

        Logger.info('2FA disabled successfully for user', userId);

        return { message: '2FA disabled successfully' };
    }
}
