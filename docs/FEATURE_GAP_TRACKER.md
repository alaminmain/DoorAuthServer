# DoorAuth Feature Gap Tracker

**Created:** 2026-02-02
**Purpose:** Track implementation of missing Client UI features (Server API exists)

---

## Summary

| Priority | Feature | Complexity | Status |
|----------|---------|------------|--------|
| P1 | Email Verification UI | Medium | **Completed** |
| P1 | 2FA Setup UI | High | **Completed** |
| P1 | Self-Service Password Reset | Medium | **Completed** |
| P2 | Smart Menu Integration | Low | Pending |
| P2 | Admin Session Management | Low | Pending |
| P3 | Users Bulk Create | Medium | Pending |
| P3 | Roles Bulk Create | Low | Pending |
| P3 | My Applications Page | Low | Pending |

**Total Gaps:** 8 features
**Completed:** 3/8

---

## P1 - High Priority Features

### 1. Email Verification UI

**API Endpoints Available:**
- `POST /api/auth/verify-email` - Verify with token
- `GET /api/auth/verify-email/:token` - Verify via link
- `POST /api/auth/resend-verification` - Resend email
- `GET /api/auth/verification-status` - Check status

**Tasks:**
- [x] Create `/verify-email` page for token input
- [x] Create `/verify-email?token=` route for link verification
- [x] Add verification status indicator (badge component)
- [x] Add "Resend verification" button component
- [x] Show banner for unverified users in dashboard
- [x] Handle verification success/error states

**Implemented Components:**
- `VerifyEmail.tsx` - Verification page with token input and URL token support
- `VerificationStatus.tsx` - Badge component showing verified/unverified status
- `ResendVerificationButton.tsx` - Reusable resend button with loading states
- `EmailVerificationBanner.tsx` - Dashboard banner for unverified users
- Added `emailVerified` field to User type
- Added `authService` methods: `verifyEmail()`, `verifyEmailByLink()`, `resendVerificationEmail()`, `getVerificationStatus()`

**Dependencies:** None

---

### 2. Two-Factor Authentication (2FA) Setup UI

**API Endpoints Available:**
- `POST /api/2fa/generate` - Generate TOTP secret + QR code
- `POST /api/2fa/verify` - Verify and enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

**Tasks:**
- [x] Create 2FA settings section in Security page
- [x] Display QR code from `/api/2fa/generate`
- [x] Add TOTP code input for verification (6-digit with auto-submit)
- [x] Show backup codes display with copy functionality
- [x] Add disable 2FA flow with password confirmation
- [x] Show 2FA status indicator badge

**Implemented Components:**
- `Security.tsx` - Security settings page with 2FA management
- `TwoFactorSetup.tsx` - Multi-step setup wizard (init → scan → verify → backup → complete)
- `TOTPInput.tsx` - 6-digit code input with auto-focus, paste support, auto-submit
- `TwoFactorStatus.tsx` - Badge showing 2FA enabled/disabled status
- `Disable2FA.tsx` - Disable 2FA form with password confirmation
- Added `authService` methods: `generate2FA()`, `verify2FA()`, `disable2FA()`, `get2FAStatus()`
- Added `/security` route and navigation

**Dependencies:** None (QR code is rendered from base64 data URL from server)

---

### 3. Self-Service Password Reset UI

**API Endpoints Available:**
- `POST /api/password/forgot-password` - Request reset email
- `POST /api/password/reset-password` - Reset with token
- `GET /api/password/validate-token` - Validate reset token

**Tasks:**
- [x] Create `/forgot-password` page
- [x] Create `/reset-password/:token` page
- [x] Add "Forgot password?" link on login page
- [x] Handle token validation
- [x] Show success/error messages
- [x] Redirect to login after reset

**Implemented Components:**
- `ForgotPassword.tsx` - Request password reset email
- `ResetPassword.tsx` - Reset password with token (includes password strength indicator)
- Updated `Login.tsx` with "Forgot password?" link
- Added `authService` methods: `forgotPassword()`, `resetPassword()`, `validateResetToken()`

**Dependencies:** None

---

## P2 - Medium Priority Features

### 4. Smart Menu Integration

**API Endpoints Available:**
- `GET /api/menus/smart` - Permission-filtered menus

**Tasks:**
- [ ] Fetch smart menus based on user permissions
- [ ] Replace static sidebar with dynamic menus
- [ ] Handle nested menu structure
- [ ] Cache menu data in context/state
- [ ] Update on permission changes

**Estimated Components:**
- Update `Sidebar.tsx` to use smart menus
- `DynamicMenu.tsx` - Recursive menu renderer
- `MenuContext.tsx` - Menu state management

**Dependencies:**
- Requires proper permission setup

---

### 5. Admin Session Management (View All)

**API Endpoints Available:**
- `GET /api/sessions` - All sessions (admin)
- `GET /api/sessions/stats` - Session statistics
- `DELETE /api/sessions/user/:userId/all` - Revoke user's sessions

**Tasks:**
- [ ] Add admin tab/view to Sessions page
- [ ] Display all active sessions across users
- [ ] Show session statistics
- [ ] Add bulk revoke capability
- [ ] Filter by user/tenant
- [ ] Add permission check (`sessions.admin`)

**Estimated Components:**
- Update `SessionsPage.tsx` with admin view
- `SessionStats.tsx` - Statistics display
- `AdminSessionTable.tsx` - All sessions table

**Dependencies:**
- Admin role/permission required

---

## P3 - Lower Priority Features

### 6. Users Bulk Create

**API Endpoints Available:**
- `POST /api/users/bulk` - Bulk create users

**Tasks:**
- [ ] Add "Bulk Import" button to Users page
- [ ] Create CSV/JSON upload dialog
- [ ] Show preview of users to import
- [ ] Display import results (success/failures)
- [ ] Provide template download

**Estimated Components:**
- `BulkUserImport.tsx` - Import dialog
- `ImportPreview.tsx` - Preview table
- `ImportResults.tsx` - Results display

**Dependencies:** None

---

### 7. Roles Bulk Create

**API Endpoints Available:**
- `POST /api/roles/bulk` - Bulk create roles

**Tasks:**
- [ ] Add "Bulk Import" button to Roles page
- [ ] Create JSON upload dialog
- [ ] Show preview of roles to import
- [ ] Handle permission assignments
- [ ] Display import results

**Estimated Components:**
- `BulkRoleImport.tsx` - Import dialog
- Reuse `ImportPreview.tsx` from users

**Dependencies:** None

---

### 8. My Applications Page

**API Endpoints Available:**
- `GET /api/users/me/applications` - Get user's applications

**Tasks:**
- [ ] Create `/my-applications` page
- [ ] Display applications user has access to
- [ ] Show app details (name, URL, description)
- [ ] Add to user menu/profile section

**Estimated Components:**
- `MyApplicationsPage.tsx`
- `ApplicationCard.tsx`

**Dependencies:** None

---

## Implementation Order (Recommended)

```
Phase 1: Authentication Essentials
├── 3. Self-Service Password Reset  (enables self-service)
├── 1. Email Verification UI        (security requirement)
└── 2. 2FA Setup UI                 (security enhancement)

Phase 2: Admin Features
├── 5. Admin Session Management     (security monitoring)
└── 4. Smart Menu Integration       (dynamic UI)

Phase 3: Productivity Features
├── 6. Users Bulk Create            (admin efficiency)
├── 7. Roles Bulk Create            (admin efficiency)
└── 8. My Applications Page         (user convenience)
```

---

## Progress Log

| Date | Feature | Action | Notes |
|------|---------|--------|-------|
| 2026-02-02 | - | Tracker created | Initial gap analysis |
| 2026-02-04 | Self-Service Password Reset | Completed | ForgotPassword.tsx, ResetPassword.tsx, Login.tsx updated |
| 2026-02-04 | Email Verification UI | Completed | VerifyEmail.tsx, VerificationStatus.tsx, ResendVerificationButton.tsx, EmailVerificationBanner.tsx |
| 2026-02-04 | 2FA Setup UI | Completed | Security.tsx, TwoFactorSetup.tsx, TOTPInput.tsx, TwoFactorStatus.tsx, Disable2FA.tsx |

---

## Notes

- All features have existing Server API endpoints
- Client implementation only needed
- Follow existing UI patterns (Tailwind, React Hook Form, Zod)
- Use existing API client (`axios` setup)
- Maintain permission checks where applicable
