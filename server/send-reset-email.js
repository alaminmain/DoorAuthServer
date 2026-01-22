/**
 * Send Password Reset Email to alaminmain@gmail.com
 */

const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Email configuration
const emailConfig = {
  host: process.env.BREVO_SMTP_SERVER || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_KEY,
  },
};

async function sendPasswordResetEmail() {
  console.log('📧 Sending Password Reset Email to alaminmain@gmail.com\n');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);

    // Verify connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Find user - try alaminmain@gmail.com first, fallback to bd@gmail.com
    console.log('👤 Finding user in database...');
    let user = await prisma.user.findFirst({
      where: { email: 'alaminmain@gmail.com' },
      include: { tenant: true },
    });

    let targetEmail = 'alaminmain@gmail.com';

    if (!user) {
      console.log('⚠️  alaminmain@gmail.com not found, using bd@gmail.com...');
      user = await prisma.user.findFirst({
        where: { email: 'bd@gmail.com' },
        include: { tenant: true },
      });
      targetEmail = 'bd@gmail.com';

      if (!user) {
        throw new Error('No user found in database');
      }
    }

    console.log('✅ User found:', user.userName || user.email);
    console.log('   Email:', targetEmail);
    console.log('   Tenant:', user.tenant.name, '\n');

    // Generate reset token
    console.log('🔑 Generating password reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1);

    // Deactivate old tokens
    await prisma.passToken.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    // Create new token
    await prisma.passToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        remarks: 'Password Reset - Manual Test',
        isActive: true,
        expireDate,
      },
    });

    console.log('✅ Token generated and saved\n');

    // Prepare email
    const resetUrl = `${process.env.BASE_URL || 'https://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'DoorAuth'} <${process.env.EMAIL_FROM || 'noreply@doorauth.com'}>`,
      to: targetEmail,
      subject: 'Password Reset Request - DoorAuthServer',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .token-box { background: #fff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; font-family: monospace; word-break: break-all; font-size: 12px; }
            .info-box { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.userName || 'User'},</p>
              <p>We received a request to reset your password for your <strong>DoorAuth</strong> account.</p>
              
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Your Password</a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">${resetUrl}</div>
              
              <div class="info-box">
                <p><strong>⏰ This link will expire in 1 hour.</strong></p>
                <p style="margin: 5px 0;">For your security, this password reset link can only be used once.</p>
              </div>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p>Need help? Contact our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorAuth. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Hello ${user.userName || 'User'},

We received a request to reset your password for your DoorAuth account.

Please use the following link to reset your password:
${resetUrl}

⏰ This link will expire in 1 hour.

For your security, this password reset link can only be used once.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} DoorAuth
      `,
    };

    // Send email
    console.log('📤 Sending email to ' + targetEmail + '...');
    const info = await transporter.sendMail(mailOptions);

    console.log('\n' + '='.repeat(70));
    console.log('✅ PASSWORD RESET EMAIL SENT SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📧 Email Details:');
    console.log('   To:', targetEmail);
    console.log('   Subject: Password Reset Request - DoorAuthServer');
    console.log('   Message ID:', info.messageId);
    console.log('\n🔗 Reset URL:');
    console.log('   ' + resetUrl);
    console.log('\n💡 Next Steps:');
    console.log('   1. Check inbox for ' + targetEmail);
    console.log('   2. Check spam folder if not in inbox');
    console.log('   3. Click the "Reset Your Password" button');
    console.log('   4. Or copy/paste the URL into your browser');
    console.log('   5. Link expires in 1 hour');
    console.log('\n✅ Email feature is working correctly!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Failed to send email:', error.message);
    if (error.code === 'EAUTH') {
      console.error('\n💡 SMTP Authentication failed. Please check:');
      console.error('   - BREVO_SMTP_LOGIN in .env');
      console.error('   - BREVO_SMTP_KEY in .env');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

sendPasswordResetEmail();
