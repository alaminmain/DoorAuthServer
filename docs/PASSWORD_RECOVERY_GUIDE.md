# Password Recovery Implementation

## Overview
Secure password recovery system with email-based token verification using Nodemailer and Mailtrap.

## Features
- ✅ Secure token generation using crypto
- ✅ Email delivery via Mailtrap SMTP
- ✅ 1-hour token expiration
- ✅ One-time use tokens
- ✅ Protection against email enumeration
- ✅ Beautiful HTML email templates

## API Endpoints

### 1. Request Password Reset
**Endpoint:** `POST /api/password/forgot-password`

Sends a password reset email to the user.

**Request:**
```bash
POST http://localhost:3000/api/password/forgot-password
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "tenantId": "<tenant-id>"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a password reset link has been sent."
  }
}
```

**Note:** The response is intentionally vague to prevent email enumeration attacks.

---

### 2. Validate Reset Token
**Endpoint:** `GET /api/password/validate-token?token=<token>`

Validates if a reset token is still valid (not expired or used).

**Request:**
```bash
GET http://localhost:3000/api/password/validate-token?token=abc123...
```

**Response (Valid):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Token is valid"
  }
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

---

### 3. Reset Password
**Endpoint:** `POST /api/password/reset-password`

Resets the user's password using a valid token.

**Request:**
```bash
POST http://localhost:3000/api/password/reset-password
Content-Type: application/json

{
  "token": "abc123...",
  "newPassword": "MyNewSecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful. You can now login with your new password."
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- (Additional validation can be added as needed)

---

## Email Configuration

The system uses **Mailtrap** for email delivery. Configuration is stored in `.env`:

```env
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=api
MAIL_PASS=78040f6f5606266dfd703b47bc82b770
MAIL_FROM=noreply@doorauthserver.com
APP_URL=http://localhost:3000
```

---

## Testing Flow

### Step 1: Request Password Reset
```bash
POST http://localhost:3000/api/password/forgot-password
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "tenantId": "your-tenant-id"
}
```

### Step 2: Check Email
- Check your Mailtrap inbox
- You'll receive a beautifully formatted HTML email
- Click the reset link or copy the token

### Step 3: Validate Token (Optional)
```bash
GET http://localhost:3000/api/password/validate-token?token=<your-token>
```

### Step 4: Reset Password
```bash
POST http://localhost:3000/api/password/reset-password
Content-Type: application/json

{
  "token": "<your-token>",
  "newPassword": "NewPassword123!"
}
```

### Step 5: Login with New Password
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "NewPassword123!",
  "tenantId": "your-tenant-id"
}
```

---

## Security Features

### 1. Token Security
- **Cryptographically secure**: Uses `crypto.randomBytes(32)`
- **Hashed storage**: Tokens are hashed with SHA-256 before storage
- **One-time use**: Tokens are invalidated after use
- **Time-limited**: 1-hour expiration

### 2. Email Enumeration Protection
- Same response for existing and non-existing emails
- Prevents attackers from discovering valid email addresses

### 3. Token Invalidation
- Previous tokens are deactivated when new reset is requested
- Tokens are marked as used after password reset
- Expired tokens are automatically rejected

### 4. Account Security
- Failed login attempts are reset after password change
- Locked accounts are unlocked after successful password reset

---

## Email Templates

The system sends two types of emails:

### Password Reset Email
- Professional HTML design
- Clear call-to-action button
- Fallback plain text link
- Security warnings
- Expiration notice

### Welcome Email (Bonus)
- Sent on registration
- Lists available features
- Encourages 2FA setup

---

## Troubleshooting

### Email Not Received
1. Check Mailtrap inbox (not your real email)
2. Verify MAIL_* environment variables
3. Check server logs for email errors
4. Test connection: `emailService.verifyConnection()`

### Token Invalid
- Tokens expire after 1 hour
- Tokens can only be used once
- Requesting new reset invalidates old tokens

### Password Requirements Not Met
- Ensure password is at least 8 characters
- Add custom validation as needed

---

## Next Steps

Consider adding:
- Password strength validation (uppercase, lowercase, numbers, symbols)
- Rate limiting on forgot-password endpoint
- CAPTCHA for additional security
- Email verification on registration
