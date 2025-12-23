# 2FA (Two-Factor Authentication) Implementation

## Overview
This implementation uses **TOTP (Time-based One-Time Password)** with the Speakeasy library, compatible with Google Authenticator, Authy, and other authenticator apps.

## API Endpoints

### 1. Generate 2FA Secret
**Endpoint:** `POST /api/2fa/generate`  
**Authentication:** Required (Bearer Token)

Generates a new 2FA secret and QR code for the authenticated user.

**Request:**
```bash
POST http://localhost:3000/api/2fa/generate
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "otpauthUrl": "otpauth://totp/DoorAuthServer%20(user@demo.localhost)?secret=JBSWY3DPEHPK3PXP&issuer=DoorAuthServer"
  },
  "message": "2FA secret generated. Scan the QR code with your authenticator app."
}
```

### 2. Verify and Enable 2FA
**Endpoint:** `POST /api/2fa/verify`  
**Authentication:** Required (Bearer Token)

Verifies the TOTP token from your authenticator app and enables 2FA.

**Request:**
```bash
POST http://localhost:3000/api/2fa/verify
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "2FA enabled successfully"
  }
}
```

### 3. Login with 2FA
**Endpoint:** `POST /api/auth/login`

When 2FA is enabled, you need to provide the `twoFactorToken` in the login request.

**First attempt (without 2FA token):**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "password123",
  "tenantId": "<tenant-id>"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requires2FA": true,
    "message": "2FA token required"
  }
}
```

**Second attempt (with 2FA token):**
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "password123",
  "tenantId": "<tenant-id>",
  "twoFactorToken": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### 4. Disable 2FA
**Endpoint:** `POST /api/2fa/disable`  
**Authentication:** Required (Bearer Token)

Disables 2FA for the authenticated user. Requires a valid 2FA token.

**Request:**
```bash
POST http://localhost:3000/api/2fa/disable
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "2FA disabled successfully"
  }
}
```

## Testing Flow

1. **Register/Login** to get a JWT token
2. **Generate 2FA Secret** using the token
3. **Scan QR Code** with Google Authenticator or Authy
4. **Verify Token** from your app to enable 2FA
5. **Logout and Login Again** - now you'll need the 2FA token
6. **Disable 2FA** if needed (requires valid token)

## Security Features

- ✅ TOTP tokens expire after 30 seconds
- ✅ 2-step time window tolerance for clock drift
- ✅ Secret stored encrypted in database
- ✅ 2FA can only be disabled with valid token
- ✅ Compatible with all major authenticator apps

## Supported Authenticator Apps

- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator
- Any TOTP-compatible app
