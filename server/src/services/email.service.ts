import nodemailer from 'nodemailer';
import { Logger } from '../utils/Logger';

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST || 'live.smtp.mailtrap.io',
            port: parseInt(process.env.MAIL_PORT || '587'),
            auth: {
                user: process.env.MAIL_USER || 'api',
                pass: process.env.MAIL_PASS || '',
            },
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(to: string, resetToken: string, userName?: string) {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.MAIL_FROM || 'noreply@doorauthserver.com',
            to,
            subject: 'Password Reset Request - DoorAuthServer',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .token-box { background: #fff; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'User'},</p>
              <p>We received a request to reset your password for your DoorAuthServer account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">${resetUrl}</div>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorAuthServer. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
        Password Reset Request
        
        Hello ${userName || 'User'},
        
        We received a request to reset your password for your DoorAuthServer account.
        
        Please use the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
        
        © ${new Date().getFullYear()} DoorAuthServer
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            Logger.info('Password reset email sent', { to, messageId: info.messageId });
            return info;
        } catch (error: any) {
            Logger.error('Failed to send password reset email', error);
            throw new Error('Failed to send email');
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(to: string, userName: string) {
        const mailOptions = {
            from: process.env.MAIL_FROM || 'noreply@doorauthserver.com',
            to,
            subject: 'Welcome to DoorAuthServer! 🎉',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to DoorAuthServer!</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Thank you for registering with DoorAuthServer!</p>
              <p>Your account has been successfully created. You can now:</p>
              <ul>
                <li>✅ Access your applications with Single Sign-On</li>
                <li>🔐 Enable Two-Factor Authentication for extra security</li>
                <li>👥 Manage your profile and permissions</li>
              </ul>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorAuthServer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            Logger.info('Welcome email sent', { to, messageId: info.messageId });
            return info;
        } catch (error: any) {
            Logger.error('Failed to send welcome email', error);
            // Don't throw error for welcome emails - it's not critical
        }
    }

    /**
     * Verify email configuration
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            Logger.info('Email service connection verified');
            return true;
        } catch (error: any) {
            Logger.error('Email service connection failed', error);
            return false;
        }
    }
}
