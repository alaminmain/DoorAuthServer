# Phase 6: Security Hardening - Implementation Plan

## 🎯 Objective
Transform DoorAuthServer from 63% to 85% completeness by implementing critical security features.

**Timeline**: 1-2 weeks
**Priority**: CRITICAL
**Status**: Ready to Start

---

## 📋 Features to Implement

### 1. Session Management ⭐⭐⭐⭐⭐
**Time**: 6-8 hours
**Priority**: P0 (Critical)

#### Database Schema
```prisma
model Session {
  id            String    @id @default(uuid())
  userId        String
  sessionToken  String    @unique
  deviceInfo    String?
  browser       String?
  os            String?
  ipAddress     String?
  loginTime     DateTime  @default(now())
  lastActivity  DateTime  @default(now())
  expiresAt     DateTime
  isActive      Boolean   @default(true)
  revokedAt     DateTime?
  revokeReason  String?
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([sessionToken])
  @@index([isActive])
  @@map("sessions")
}
```

#### API Endpoints
- `GET /api/sessions` - List all active sessions (admin)
- `GET /api/sessions/my` - Get current user's sessions
- `GET /api/users/:id/sessions` - Get user's sessions
- `DELETE /api/sessions/:id` - Revoke specific session
- `DELETE /api/sessions/my/:id` - User revokes own session
- `DELETE /api/users/:id/sessions/all` - Revoke all user sessions
- `POST /api/sessions/validate` - Validate session token

#### Implementation Tasks
- [ ] Add Session model to schema.prisma
- [ ] Run migration: `npx prisma migrate dev --name add_sessions`
- [ ] Create `session.service.ts`
- [ ] Create `session.controller.ts`
- [ ] Create `session.routes.ts`
- [ ] Update auth middleware to track sessions
- [ ] Add session creation on login
- [ ] Add session cleanup job (expired sessions)
- [ ] Add session validation middleware
- [ ] Update logout to revoke session
- [ ] Add device fingerprinting
- [ ] Add tests

---

### 2. Token Blacklisting ⭐⭐⭐⭐⭐
**Time**: 4-6 hours
**Priority**: P0 (Critical)

#### Database Schema
```prisma
model TokenBlacklist {
  id          String    @id @default(uuid())
  jti         String    @unique  // JWT ID
  userId      String
  tokenType   String    // 'access' | 'refresh' | 'id'
  token       String?   // Hashed token
  expiresAt   DateTime
  revokedAt   DateTime  @default(now())
  reason      String?   // 'logout' | 'security' | 'admin' | 'password_change'
  revokedBy   String?   // Admin user ID if revoked by admin
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([jti])
  @@index([userId])
  @@index([expiresAt])
  @@map("token_blacklist")
}
```

#### API Endpoints
- `POST /api/tokens/revoke` - Revoke current token
- `POST /api/tokens/revoke-all` - Revoke all user tokens
- `POST /api/users/:id/tokens/revoke-all` - Admin revokes user tokens
- `GET /api/tokens/blacklist` - List blacklisted tokens (admin)
- `POST /api/tokens/validate` - Check if token is valid

#### Implementation Tasks
- [ ] Add TokenBlacklist model to schema.prisma
- [ ] Run migration: `npx prisma migrate dev --name add_token_blacklist`
- [ ] Update JWT generation to include `jti` (JWT ID)
- [ ] Create `tokenBlacklist.service.ts`
- [ ] Create `tokenBlacklist.controller.ts`
- [ ] Create `tokenBlacklist.routes.ts`
- [ ] Update auth middleware to check blacklist
- [ ] Add token revocation on logout
- [ ] Add token revocation on password change
- [ ] Add cleanup job for expired blacklist entries
- [ ] Add tests

---

### 3. Rate Limiting ⭐⭐⭐⭐⭐
**Time**: 2-3 hours
**Priority**: P0 (Critical)

#### Dependencies
```bash
npm install express-rate-limit
npm install @types/express-rate-limit --save-dev
```

#### Implementation
```typescript
// src/middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Moderate rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset requests, please try again later',
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: 'Too many accounts created, please try again later',
});
```

#### Implementation Tasks
- [ ] Install express-rate-limit
- [ ] Create `rateLimiter.ts` middleware
- [ ] Apply `authLimiter` to `/api/auth/login`
- [ ] Apply `registerLimiter` to `/api/auth/register`
- [ ] Apply `passwordResetLimiter` to `/api/password/*`
- [ ] Apply `apiLimiter` globally to `/api/*`
- [ ] Add rate limit headers to responses
- [ ] Add rate limit bypass for trusted IPs (optional)
- [ ] Add tests
- [ ] Document rate limits in Swagger

---

### 4. Email Verification ⭐⭐⭐⭐
**Time**: 5-7 hours
**Priority**: P1 (High)

#### Database Schema
```prisma
model EmailVerification {
  id          String    @id @default(uuid())
  userId      String
  token       String    @unique
  email       String
  expiresAt   DateTime
  verifiedAt  DateTime?
  createdAt   DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@map("email_verifications")
}

// Update User model
model User {
  // ... existing fields
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?
  
  // ... existing relations
  emailVerifications EmailVerification[]
}
```

#### API Endpoints
- `POST /api/auth/verify-email` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email
- `GET /api/auth/verify-email/:token` - Verify via link (redirect)

#### Email Template
```html
<!DOCTYPE html>
<html>
<head>
  <title>Verify Your Email</title>
</head>
<body>
  <h1>Welcome to DoorAuth!</h1>
  <p>Please verify your email address by clicking the link below:</p>
  <a href="{{verificationUrl}}">Verify Email</a>
  <p>Or copy and paste this link: {{verificationUrl}}</p>
  <p>This link will expire in 24 hours.</p>
</body>
</html>
```

#### Implementation Tasks
- [ ] Add EmailVerification model to schema.prisma
- [ ] Update User model with email verification fields
- [ ] Run migration: `npx prisma migrate dev --name add_email_verification`
- [ ] Create email verification service
- [ ] Create email templates
- [ ] Update registration to send verification email
- [ ] Create verification endpoint
- [ ] Create resend verification endpoint
- [ ] Add middleware to check email verification
- [ ] Update login to check email verification
- [ ] Add verification status to user profile
- [ ] Add tests

---

### 5. Enhanced Audit Logging ⭐⭐⭐⭐
**Time**: 4-5 hours
**Priority**: P1 (High)

#### Database Schema Updates
```prisma
model AuditLog {
  id            String    @id @default(uuid())
  action        String
  resource      String
  resourceId    String?
  severity      String    // 'info' | 'warning' | 'error' | 'critical'
  category      String    // 'auth' | 'user' | 'role' | 'permission' | 'data' | 'security'
  success       Boolean   @default(true)
  errorMessage  String?
  ipAddress     String?
  userAgent     String?
  details       Json?
  metadata      Json?
  sessionId     String?
  createdAt     DateTime  @default(now()) @map("created_at")
  
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tenantId      String
  user          User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId        String?
  
  @@index([tenantId])
  @@index([userId])
  @@index([category])
  @@index([severity])
  @@index([createdAt])
  @@map("audit_logs")
}
```

#### Events to Log
```typescript
// Security Events
- LOGIN_SUCCESS
- LOGIN_FAILED
- LOGOUT
- PASSWORD_CHANGED
- PASSWORD_RESET_REQUESTED
- PASSWORD_RESET_COMPLETED
- 2FA_ENABLED
- 2FA_DISABLED
- 2FA_VERIFIED
- EMAIL_VERIFIED
- ACCOUNT_LOCKED
- ACCOUNT_UNLOCKED
- SESSION_CREATED
- SESSION_REVOKED
- TOKEN_REVOKED

// User Management Events
- USER_CREATED
- USER_UPDATED
- USER_DELETED
- USER_APPROVED
- USER_REJECTED
- ROLE_ASSIGNED
- ROLE_REMOVED

// Authorization Events
- PERMISSION_GRANTED
- PERMISSION_DENIED
- ROLE_CREATED
- ROLE_UPDATED
- ROLE_DELETED
- PERMISSION_CREATED
- PERMISSION_DELETED

// Application Events
- APPLICATION_CREATED
- APPLICATION_UPDATED
- APPLICATION_DELETED
- CLIENT_SECRET_REGENERATED

// Suspicious Activities
- MULTIPLE_FAILED_LOGINS
- UNUSUAL_IP_ACCESS
- CONCURRENT_SESSION_LIMIT_EXCEEDED
- INVALID_TOKEN_USAGE
```

#### API Endpoints
- `GET /api/audit-logs` - Search and filter logs
- `GET /api/audit-logs/security` - Security events only
- `GET /api/audit-logs/user/:id` - User-specific logs
- `GET /api/audit-logs/export` - Export logs (CSV/JSON)
- `GET /api/audit-logs/stats` - Audit statistics

#### Implementation Tasks
- [ ] Update AuditLog model in schema.prisma
- [ ] Run migration: `npx prisma migrate dev --name enhance_audit_logs`
- [ ] Create comprehensive audit service
- [ ] Add audit logging to all authentication endpoints
- [ ] Add audit logging to all user management endpoints
- [ ] Add audit logging to all role/permission endpoints
- [ ] Add audit logging to all application endpoints
- [ ] Create audit log search/filter endpoint
- [ ] Create audit log export functionality
- [ ] Add audit log retention policy
- [ ] Add audit log cleanup job
- [ ] Add tests

---

## 🔧 Implementation Order

### Day 1-2: Rate Limiting & Token Blacklisting
- ✅ Quick wins with immediate security impact
- Implement rate limiting (2-3 hours)
- Implement token blacklisting (4-6 hours)
- Test and verify

### Day 3-4: Session Management
- ✅ Core security feature
- Implement session model and service (4 hours)
- Implement session endpoints (2 hours)
- Update auth flow (2 hours)
- Test and verify

### Day 5-6: Email Verification
- ✅ Important for data quality
- Implement email verification model (2 hours)
- Implement verification service (2 hours)
- Create email templates (1 hour)
- Update registration flow (2 hours)
- Test and verify

### Day 7-8: Enhanced Audit Logging
- ✅ Compliance and monitoring
- Update audit log model (1 hour)
- Add comprehensive logging (3 hours)
- Create audit endpoints (2 hours)
- Test and verify

### Day 9-10: Testing & Documentation
- ✅ Quality assurance
- Write comprehensive tests
- Update API documentation
- Update integration guides
- Performance testing
- Security testing

---

## 📊 Success Metrics

### Before Phase 6
- Overall Completeness: 63%
- Security Score: 60%
- Session Management: 20%
- Token Management: 50%
- Audit Logging: 50%

### After Phase 6
- Overall Completeness: 85%
- Security Score: 90%
- Session Management: 95%
- Token Management: 95%
- Audit Logging: 90%

---

## 🧪 Testing Checklist

### Rate Limiting Tests
- [ ] Login rate limit works (5 attempts)
- [ ] Registration rate limit works (3 per hour)
- [ ] Password reset rate limit works (3 per hour)
- [ ] API rate limit works (100 per minute)
- [ ] Rate limit headers are correct
- [ ] Rate limit resets after window

### Token Blacklisting Tests
- [ ] Token is blacklisted on logout
- [ ] Blacklisted token is rejected
- [ ] Token is blacklisted on password change
- [ ] Admin can revoke user tokens
- [ ] Expired blacklist entries are cleaned up
- [ ] JTI is unique for each token

### Session Management Tests
- [ ] Session is created on login
- [ ] Session is tracked correctly
- [ ] User can view their sessions
- [ ] User can revoke their sessions
- [ ] Admin can revoke user sessions
- [ ] Expired sessions are cleaned up
- [ ] Session validation works
- [ ] Device info is captured

### Email Verification Tests
- [ ] Verification email is sent on registration
- [ ] Verification link works
- [ ] Expired verification link is rejected
- [ ] User can resend verification email
- [ ] Unverified users cannot login (optional)
- [ ] Email verification status is tracked

### Audit Logging Tests
- [ ] All security events are logged
- [ ] All user events are logged
- [ ] All authorization events are logged
- [ ] Audit logs can be searched
- [ ] Audit logs can be filtered
- [ ] Audit logs can be exported
- [ ] Audit log retention works

---

## 📚 Documentation Updates

### Files to Update
1. `README.md` - Add new features
2. `IMPLEMENTATION_COMPLETE.md` - Update status
3. `SWAGGER_GUIDE.md` - Add new endpoints
4. `TESTING_GUIDE.md` - Add new tests
5. Create `SESSION_MANAGEMENT_GUIDE.md`
6. Create `SECURITY_BEST_PRACTICES.md`

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Rate limits configured appropriately
- [ ] Email service configured
- [ ] Audit log retention policy set
- [ ] Session cleanup job scheduled
- [ ] Token blacklist cleanup job scheduled
- [ ] Documentation updated
- [ ] Security review completed

### After Deployment
- [ ] Monitor rate limit effectiveness
- [ ] Monitor session creation/revocation
- [ ] Monitor audit logs for anomalies
- [ ] Monitor email delivery
- [ ] Monitor token blacklist size
- [ ] Performance testing
- [ ] Security testing

---

## 💡 Best Practices

### Rate Limiting
- Use Redis for distributed rate limiting (production)
- Configure different limits for different environments
- Add rate limit bypass for trusted IPs
- Monitor rate limit hits

### Session Management
- Use secure session tokens
- Implement session timeout
- Track device fingerprints
- Allow users to manage their sessions
- Implement concurrent session limits

### Token Blacklisting
- Add JTI to all tokens
- Clean up expired entries regularly
- Use Redis for faster lookups (production)
- Monitor blacklist size

### Email Verification
- Use secure random tokens
- Set appropriate expiry (24 hours)
- Allow resending verification emails
- Track verification status
- Send welcome email after verification

### Audit Logging
- Log all security-relevant events
- Include context (IP, user agent, etc.)
- Set appropriate retention policy
- Monitor for suspicious patterns
- Export logs for compliance

---

## 🎯 Next Steps After Phase 6

Once Phase 6 is complete, proceed to:

**Phase 7: Enterprise Features**
- Password Policies
- API Key Management
- User Approval Workflow
- IP Access Control
- Additional 2FA Methods

---

**Ready to start? Let's implement these critical security features!** 🚀
