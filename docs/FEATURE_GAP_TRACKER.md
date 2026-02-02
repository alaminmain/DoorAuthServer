# DoorAuth Feature Gap Tracker

**Created:** 2026-02-02
**Purpose:** Track implementation of missing Client UI features (Server API exists)

---

## Summary

| Priority | Feature | Complexity | Status |
|----------|---------|------------|--------|
| P1 | Email Verification UI | Medium | Pending |
| P1 | 2FA Setup UI | High | Pending |
| P1 | Self-Service Password Reset | Medium | Pending |
| P2 | Smart Menu Integration | Low | Pending |
| P2 | Admin Session Management | Low | Pending |
| P3 | Users Bulk Create | Medium | Pending |
| P3 | Roles Bulk Create | Low | Pending |
| P3 | My Applications Page | Low | Pending |

**Total Gaps:** 8 features
**Completed:** 0/8

---

## P1 - High Priority Features

### 1. Email Verification UI

**API Endpoints Available:**
- `POST /api/auth/verify-email` - Verify with token
- `GET /api/auth/verify-email/:token` - Verify via link
- `POST /api/auth/resend-verification` - Resend email
- `GET /api/auth/verification-status` - Check status

**Tasks:**
- [ ] Create `/verify-email` page for token input
- [ ] Create `/verify-email/:token` route for link verification
- [ ] Add verification status indicator on user profile
- [ ] Add "Resend verification" button
- [ ] Show banner for unverified users
- [ ] Handle verification success/error states

**Estimated Components:**
- `VerifyEmailPage.tsx`
- `VerificationStatus.tsx` (badge component)
- `ResendVerificationButton.tsx`

**Dependencies:** None

---

### 2. Two-Factor Authentication (2FA) Setup UI

**API Endpoints Available:**
- `POST /api/2fa/generate` - Generate TOTP secret + QR code
- `POST /api/2fa/verify` - Verify and enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

**Tasks:**
- [ ] Create 2FA settings section in user profile/security page
- [ ] Display QR code from `/api/2fa/generate`
- [ ] Add TOTP code input for verification
- [ ] Show backup codes (if implemented)
- [ ] Add disable 2FA flow with password confirmation
- [ ] Show 2FA status indicator

**Estimated Components:**
- `TwoFactorSetup.tsx` - Main setup wizard
- `QRCodeDisplay.tsx` - QR code renderer
- `TOTPInput.tsx` - 6-digit code input
- `TwoFactorStatus.tsx` - Enable/disable toggle

**Dependencies:**
- qrcode library (already used server-side)
- May need `react-qrcode` or similar

---

### 3. Self-Service Password Reset UI

**API Endpoints Available:**
- `POST /api/password/forgot-password` - Request reset email
- `POST /api/password/reset-password` - Reset with token
- `GET /api/password/validate-token` - Validate reset token

**Tasks:**
- [ ] Create `/forgot-password` page
- [ ] Create `/reset-password/:token` page
- [ ] Add "Forgot password?" link on login page
- [ ] Handle token validation
- [ ] Show success/error messages
- [ ] Redirect to login after reset

**Estimated Components:**
- `ForgotPasswordPage.tsx`
- `ResetPasswordPage.tsx`
- Update `LoginPage.tsx` with forgot password link

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

---

## Notes

- All features have existing Server API endpoints
- Client implementation only needed
- Follow existing UI patterns (Tailwind, React Hook Form, Zod)
- Use existing API client (`axios` setup)
- Maintain permission checks where applicable
