/**
 * Test script for Password Reset Email
 * 
 * This script tests the forgot password email flow without starting the server
 */

const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Email configuration from .env
const emailConfig = {
    host: process.env.BREVO_SMTP_SERVER || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
    },
};

async function testPasswordResetEmail() {
    console.log('🧪 Testing Password Reset Email Flow...\n');

    try {
        // Step 1: Check email configuration
        console.log('📧 Step 1: Checking email configuration...');
        console.log('SMTP Server:', emailConfig.host);
        console.log('SMTP Port:', emailConfig.port);
        console.log('SMTP User:', emailConfig.auth.user ? '✅ Configured' : '❌ Missing');
        console.log('SMTP Pass:', emailConfig.auth.pass ? '✅ Configured' : '❌ Missing');

        if (!emailConfig.auth.user || !emailConfig.auth.pass) {
            console.error('\n❌ Email credentials not configured in .env file');
            console.log('\nPlease add to server/.env:');
            console.log('BREVO_SMTP_LOGIN=your-smtp-login');
            console.log('BREVO_SMTP_KEY=your-smtp-key');
            process.exit(1);
        }

        // Step 2: Test SMTP connection
        console.log('\n🔌 Step 2: Testing SMTP connection...');
        const transporter = nodemailer.createTransport(emailConfig);

        try {
            await transporter.verify();
            console.log('✅ SMTP connection successful!');
        } catch (error) {
            console.error('❌ SMTP connection failed:', error.message);
            throw error;
        }

        // Step 3: Find test user
        console.log('\n👤 Step 3: Finding test user (bd@gmail.com)...');
        const user = await prisma.user.findFirst({
            where: {
                email: 'alaminmain@yahoo.com',
            },
            include: {
                tenant: true,
            },
        });

        if (!user) {
            console.error('❌ Test user not found');
            console.log('\nPlease ensure bd@gmail.com exists in the database');
            process.exit(1);
        }

        console.log('✅ User found:', user.userName || user.email);
        console.log('   Tenant:', user.tenant.name);

        // Step 4: Generate reset token
        console.log('\n🔑 Step 4: Generating password reset token...');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        const expireDate = new Date();
        expireDate.setHours(expireDate.getHours() + 1);

        // Deactivate old tokens
        await prisma.passToken.updateMany({
            where: {
                userId: user.id,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });

        // Create new token
        const passToken = await prisma.passToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                remarks: 'Password Reset Test',
                isActive: true,
                expireDate,
            },
        });

        console.log('✅ Token generated and saved to database');
        console.log('   Token ID:', passToken.id);
        console.log('   Expires:', expireDate.toLocaleString());

        // Step 5: Prepare email
        console.log('\n📨 Step 5: Preparing password reset email...');
        const resetUrl = `${process.env.BASE_URL || 'https://localhost:3000'}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `${process.env.EMAIL_FROM_NAME || 'DoorAuth'} <${process.env.EMAIL_FROM || 'noreply@doorauth.com'}>`,
            to: user.email,
            subject: 'Password Reset Request - DoorAuthServer (TEST)',
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
            .token-box { background: #fff; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0; font-family: monospace; word-break: break-all; }
            .test-badge { background: #ff9800; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <span class="test-badge">TEST EMAIL</span>
            </div>
            <div class="content">
              <p>Hello ${user.userName || 'User'},</p>
              <p>We received a request to reset your password for your DoorAuthServer account.</p>
              <p><strong>This is a TEST email to verify the password reset flow is working.</strong></p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">${resetUrl}</div>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorAuthServer. All rights reserved.</p>
              <p>This is an automated test email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
        Password Reset Request (TEST)
        
        Hello ${user.userName || 'User'},
        
        We received a request to reset your password for your DoorAuthServer account.
        
        This is a TEST email to verify the password reset flow is working.
        
        Please use the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
        
        © ${new Date().getFullYear()} DoorAuthServer
      `,
        };

        console.log('✅ Email prepared');
        console.log('   To:', mailOptions.to);
        console.log('   Subject:', mailOptions.subject);

        // Step 6: Send email
        console.log('\n📤 Step 6: Sending email...');
        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Response:', info.response);

        // Step 7: Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ PASSWORD RESET EMAIL TEST COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log('   ✅ SMTP connection verified');
        console.log('   ✅ User found in database');
        console.log('   ✅ Reset token generated');
        console.log('   ✅ Token saved to database');
        console.log('   ✅ Email sent successfully');
        console.log('\n📧 Check your inbox:', user.email);
        console.log('🔗 Reset URL:', resetUrl);
        console.log('\n💡 Next steps:');
        console.log('   1. Check your email inbox (and spam folder)');
        console.log('   2. Click the reset link or copy/paste the URL');
        console.log('   3. The link will be valid for 1 hour');
        console.log('   4. You can test the reset by calling:');
        console.log('      POST /api/password/reset-password');
        console.log('      { "token": "' + resetToken.substring(0, 20) + '...", "newPassword": "NewPass123!" }');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
console.log('🚀 Starting Password Reset Email Test\n');
console.log('This will:');
console.log('  1. Verify SMTP configuration');
console.log('  2. Test SMTP connection');
console.log('  3. Find test user (bd@gmail.com)');
console.log('  4. Generate password reset token');
console.log('  5. Save token to database');
console.log('  6. Send password reset email');
console.log('\n' + '='.repeat(60) + '\n');

testPasswordResetEmail();
