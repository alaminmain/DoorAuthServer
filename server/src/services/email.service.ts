import nodemailer from 'nodemailer';
import { Logger } from '../utils/Logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure Brevo SMTP
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_SERVER || 'smtp-relay.brevo.com',
      port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
      secure: false, // Use TLS
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });

    Logger.info('Email service initialized with Brevo SMTP');
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string) {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'DoorAuth'} <${process.env.EMAIL_FROM || 'noreply@doorauth.com'}>`,
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
   * Send email verification
   */
  async sendVerificationEmail(to: string, verificationUrl: string, userName?: string) {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'DoorAuth'} <${process.env.EMAIL_FROM || 'noreply@doorauth.com'}>`,
      to,
      subject: 'Verify Your Email - DoorAuthServer',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .url-box { background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello ${userName || 'there'},</p>
              <p>Thank you for registering with DoorAuth! Please verify your email address to complete your registration.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <div class="url-box">${verificationUrl}</div>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DoorAuthServer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email
        
        Hello ${userName || 'there'},
        
        Thank you for registering with DoorAuth! Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
        
        © ${new Date().getFullYear()} DoorAuthServer
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      Logger.info('Verification email sent', { to, messageId: info.messageId });
      return info;
    } catch (error: any) {
      Logger.error('Failed to send verification email', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userName: string) {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'DoorAuth'} <${process.env.EMAIL_FROM || 'noreply@doorauth.com'}>`,
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

  /**
   * Generic send email method
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'DoorAuth'} <${process.env.EMAIL_FROM || 'noreply@doorauth.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      Logger.info('Email sent', { to: options.to, subject: options.subject, messageId: info.messageId });
      return info;
    } catch (error: any) {
      Logger.error('Failed to send email', { to: options.to, subject: options.subject, error: error.message });
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send registration approval notification email
   */
  async sendApprovalEmail(to: string, userName: string, tenantName: string) {
    const loginUrl = `${process.env.APP_URL || 'https://localhost:3000'}/login`;

    return this.sendEmail({
      to,
      subject: 'Your Account Has Been Approved - DoorAuth',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Account Approved!</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Great news! Your account has been approved and you now have access to <strong>${tenantName}</strong>.</p>
              <p style="text-align: center;">
                <a href="${loginUrl}" class="button">Login Now</a>
              </p>
              <p>If you have any questions, please contact your administrator.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DoorAuthServer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  /**
   * Send registration rejection notification email
   */
  async sendRejectionEmail(to: string, userName: string, reason?: string) {
    return this.sendEmail({
      to,
      subject: 'Registration Request Update - DoorAuth',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .reason-box { background: #fff; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Update</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>We regret to inform you that your registration request has not been approved.</p>
              ${reason ? `<div class="reason-box"><strong>Reason:</strong> ${reason}</div>` : ''}
              <p>If you believe this was a mistake or would like more information, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DoorAuthServer. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
