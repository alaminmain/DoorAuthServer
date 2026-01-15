# Email Service Testing Guide

## ✅ Current Setup: Brevo (Sendinblue)

Your email service is configured with **Brevo SMTP**, which is production-ready!

## 🔧 Configuration

### 1. Get Brevo SMTP Credentials

1. Go to https://app.brevo.com
2. Navigate to **SMTP & API** → **SMTP**
3. Copy your credentials:
   - **Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: Your SMTP login
   - **Password**: Your SMTP key

### 2. Update `.env` File

Add these variables to `server/.env`:

```env
# Brevo Email Configuration
BREVO_SMTP_SERVER=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_LOGIN=your-smtp-login
BREVO_SMTP_KEY=your-smtp-key

# Email Settings
EMAIL_FROM=noreply@doorauth.com
EMAIL_FROM_NAME=DoorAuth
APP_URL=https://localhost:5173
```

## 🧪 Testing Methods

### Method 1: Register a New User (Recommended)

**Test email verification flow:**

1. **Register with your email:**
   ```
   Email: alaminmain@gmail.com
   Password: Test123!
   ```

2. **Check your inbox** for verification email

3. **Click the verification link** or copy/paste the URL

4. **Email should arrive within seconds!**

### Method 2: Use API Endpoint

**Send test verification email:**

```bash
# Register endpoint (sends verification email automatically)
POST https://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "alaminmain@gmail.com",
  "password": "Test123!",
  "userName": "Al Amin",
  "tenantId": "your-tenant-id"
}
```

### Method 3: Resend Verification

**If you already registered but didn't get email:**

```bash
POST https://localhost:3000/api/auth/resend-verification
Authorization: Bearer your-token
```

## 📧 Email Templates

### Verification Email
- **Subject**: "Verify Your Email - DoorAuthServer"
- **Contains**: Beautiful HTML template with verification button
- **Expires**: 24 hours

### Password Reset Email
- **Subject**: "Password Reset Request - DoorAuthServer"
- **Contains**: Reset password button
- **Expires**: 1 hour

### Welcome Email
- **Subject**: "Welcome to DoorAuthServer! 🎉"
- **Contains**: Welcome message and features

## 🔍 Troubleshooting

### Email Not Received?

1. **Check Brevo credentials** in `.env`
2. **Check spam folder**
3. **Verify Brevo account** is active
4. **Check server logs** for errors
5. **Test SMTP connection**:
   ```bash
   # In server directory
   node -e "require('./src/services/email.service').EmailService.prototype.verifyConnection()"
   ```

### Check Server Logs

Look for these messages:
```
✅ Email service initialized with Brevo SMTP
✅ Verification email sent
```

Or errors:
```
❌ Failed to send verification email
```

## 📊 Brevo Free Tier Limits

- **300 emails/day** (free)
- **Unlimited contacts**
- **SMTP & API access**
- **Email templates**

Perfect for development and small production apps!

## 🎯 Quick Test Now

**To test immediately:**

1. Make sure Brevo credentials are in `.env`
2. Restart the server: `npm run dev`
3. Go to: https://localhost:5173
4. Click "Register" or "Sign Up"
5. Use email: `alaminmain@gmail.com`
6. Check your inbox! 📬

## ✨ Email Features

Your emails include:
- ✅ Beautiful HTML templates
- ✅ Responsive design
- ✅ Plain text fallback
- ✅ Branded styling
- ✅ Security warnings
- ✅ Expiration notices
- ✅ Professional formatting

## 🔐 Security Notes

- Verification links expire after 24 hours
- Password reset links expire after 1 hour
- Tokens are cryptographically secure (32 bytes)
- One-time use only
- Logged for audit trail
