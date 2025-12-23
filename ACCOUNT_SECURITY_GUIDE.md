# Account Security & Brute Force Protection

## Overview
Comprehensive account security implementation with brute force protection, account locking, and administrative controls.

## Features
- ✅ **Brute Force Protection** - Lock accounts after failed login attempts
- ✅ **Configurable Thresholds** - Set max attempts via environment variable
- ✅ **Attempt Tracking** - Track and display remaining attempts
- ✅ **Account Locking** - Automatic lock after threshold exceeded
- ✅ **Admin Unlock** - Administrative endpoints to unlock accounts
- ✅ **Audit Logging** - All security events are logged
- ✅ **2FA Protection** - Failed 2FA attempts also count toward lock
- ✅ **Auto-Reset** - Successful login resets attempt counter

## Configuration

Add to `.env`:
```env
MAX_LOGIN_ATTEMPTS=5
```

Default is 5 attempts if not specified.

---

## How It Works

### Login Flow with Brute Force Protection

1. **User attempts login**
2. **System checks**:
   - Is account locked? → Reject
   - Is account approved? → Reject if not
   - Is password correct? → If no, increment attempts
3. **On failed password**:
   - Increment `passAttemptCount`
   - If attempts >= MAX_LOGIN_ATTEMPTS → Lock account
   - Return remaining attempts in error message
4. **On failed 2FA token**:
   - Also increments attempt counter
   - Can trigger account lock
5. **On successful login**:
   - Reset `passAttemptCount` to 0
   - Update `lastLoginTime`

---

## API Endpoints

### 1. Get Account Security Status
**Endpoint:** `GET /api/account/status`  
**Authentication:** Required (Bearer Token)

Get the current user's security status.

**Request:**
```bash
GET http://localhost:3000/api/account/status
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@demo.localhost",
    "isLocked": false,
    "isApproved": true,
    "passAttemptCount": 0,
    "lastLoginTime": "2025-12-23T10:00:00.000Z",
    "isTwoFactorEnabled": false,
    "remainingAttempts": 5,
    "maxAttempts": 5
  }
}
```

---

### 2. Unlock Account (Admin)
**Endpoint:** `POST /api/account/unlock`  
**Authentication:** Required (Bearer Token)  
**Note:** Currently requires authentication, admin role check to be added

Unlock a locked user account.

**Request:**
```bash
POST http://localhost:3000/api/account/unlock
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "userId": "locked-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "locked-user-id",
    "email": "user@demo.localhost"
  },
  "message": "Account unlocked successfully"
}
```

---

### 3. Reset Login Attempts (Admin)
**Endpoint:** `POST /api/account/reset-attempts`  
**Authentication:** Required (Bearer Token)

Reset failed login attempts without unlocking the account.

**Request:**
```bash
POST http://localhost:3000/api/account/reset-attempts
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user-id"
  },
  "message": "Login attempts reset successfully"
}
```

---

## Testing Scenarios

### Scenario 1: Trigger Account Lock

**Step 1:** Attempt login with wrong password (5 times)
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "wrong-password",
  "tenantId": "<tenant-id>"
}
```

**Attempt 1 Response:**
```json
{
  "success": false,
  "message": "Invalid credentials. 4 attempt(s) remaining before account lock."
}
```

**Attempt 5 Response:**
```json
{
  "success": false,
  "message": "Account locked due to 5 failed login attempts. Please reset your password."
}
```

**Step 2:** Try to login with correct password
```json
{
  "success": false,
  "message": "Account is locked due to too many failed login attempts. Please reset your password or contact support."
}
```

---

### Scenario 2: Unlock via Password Reset

When a user resets their password, the account is automatically unlocked:

```bash
POST http://localhost:3000/api/password/reset-password
Content-Type: application/json

{
  "token": "<reset-token>",
  "newPassword": "NewPassword123!"
}
```

The password reset service automatically:
- Sets `passAttemptCount` to 0
- Sets `isLocked` to false

---

### Scenario 3: Admin Unlock

**Step 1:** Admin gets user ID from database or user list

**Step 2:** Admin unlocks the account
```bash
POST http://localhost:3000/api/account/unlock
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "locked-user-id"
}
```

**Step 3:** User can now login normally

---

### Scenario 4: 2FA Failed Attempts

Even with correct password, failed 2FA attempts count:

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.localhost",
  "password": "password123",
  "tenantId": "<tenant-id>",
  "twoFactorToken": "wrong-token"
}
```

After 5 failed 2FA attempts, account will be locked.

---

## Security Features

### 1. Progressive Feedback
Users are informed of remaining attempts:
- "4 attempt(s) remaining before account lock"
- "3 attempt(s) remaining before account lock"
- etc.

### 2. Audit Logging
All security events are logged:
- Failed login attempts
- Account locks
- Account unlocks
- Attempt resets

### 3. Multiple Recovery Options
Locked users can:
- Reset password via email
- Contact admin for unlock
- Wait for admin intervention

### 4. Protection Against Enumeration
- Account lock messages don't reveal if account exists
- Same error for locked and non-existent accounts

---

## Database Fields

The following fields in the `User` model support this feature:

```prisma
model User {
  isLocked         Boolean   @default(false)
  passAttemptCount Int       @default(0)
  lastLoginTime    DateTime?
  isApproved       Boolean   @default(true)
}
```

---

## Environment Variables

```env
# Maximum failed login attempts before account lock
MAX_LOGIN_ATTEMPTS=5
```

---

## Best Practices

### For Users
1. Use strong, unique passwords
2. Enable 2FA for additional security
3. Don't share credentials
4. Contact admin if locked out

### For Administrators
1. Monitor locked accounts
2. Investigate suspicious lock patterns
3. Set appropriate MAX_LOGIN_ATTEMPTS for your security needs
4. Review audit logs regularly

### For Developers
1. Add admin role middleware for unlock endpoints
2. Consider adding CAPTCHA after 2-3 failed attempts
3. Implement rate limiting at network level
4. Add email notifications for account locks
5. Consider temporary locks (auto-unlock after X hours)

---

## Future Enhancements

Consider adding:
- **Time-based Auto-Unlock**: Automatically unlock after X hours
- **IP-based Rate Limiting**: Track attempts per IP address
- **CAPTCHA Integration**: Add CAPTCHA after 2-3 failed attempts
- **Email Notifications**: Notify users when account is locked
- **Suspicious Activity Detection**: Flag unusual login patterns
- **Admin Dashboard**: Visual interface for managing locked accounts
- **Role-based Access Control**: Proper admin role checks

---

## Troubleshooting

### Account Locked - Can't Login
**Solution 1:** Use password reset
```bash
POST /api/password/forgot-password
```

**Solution 2:** Contact administrator for unlock

### Attempts Not Resetting
- Ensure successful login completes fully
- Check database `passAttemptCount` field
- Verify no errors in login flow

### Admin Can't Unlock
- Verify admin has valid JWT token
- Check userId is correct
- Review server logs for errors

---

## Related Features

- **Password Recovery**: Automatically unlocks on password reset
- **2FA**: Failed 2FA attempts count toward lock
- **Audit Logging**: All events are logged for security review
