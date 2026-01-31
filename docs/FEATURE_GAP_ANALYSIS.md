# Feature Gap Analysis: Server API vs Client UI

**Generated:** 2026-01-30
**Purpose:** Identify gaps between backend API capabilities and frontend UI implementation

---

## Executive Summary

| Category | Server | Client | Gap |
|----------|--------|--------|-----|
| **Total API Endpoints** | 80+ | ~50 used | ~30 unused |
| **Full CRUD Operations** | 10 resources | 9 resources | 1 partial |
| **Authentication Features** | 8 endpoints | 2 used | 6 missing |
| **OAuth/OIDC Features** | 7 endpoints | 1 used (logout) | 6 missing |
| **Security Features** | 6 endpoints | 3 used | 3 missing |

---

## 1. AUTHENTICATION MODULE GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `POST /api/auth/register` | POST | ✅ Used (user creation) | - |
| `POST /api/auth/login` | POST | ✅ Used | - |
| `POST /api/auth/logout` | POST | ✅ Used | - |
| `POST /api/auth/refresh` | POST | ✅ Used (auto) | - |
| `POST /api/auth/verify-email` | POST | ❌ Not Used | **GAP** |
| `GET /api/auth/verify-email/:token` | GET | ❌ Not Used | **GAP** |
| `POST /api/auth/resend-verification` | POST | ❌ Not Used | **GAP** |
| `GET /api/auth/verification-status` | GET | ❌ Not Used | **GAP** |

### Missing in Client UI
1. **Email Verification Flow** - No UI to:
   - Show email verification status
   - Resend verification email
   - Handle verification callback/confirmation page

### Recommendation
Add email verification status indicator on user profile and resend option.

---

## 2. TWO-FACTOR AUTHENTICATION GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `POST /api/2fa/generate` | POST | ❌ Not Used | **GAP** |
| `POST /api/2fa/verify` | POST | ❌ Not Used | **GAP** |
| `POST /api/2fa/disable` | POST | ❌ Not Used | **GAP** |

### Missing in Client UI
1. **2FA Setup Flow** - No UI to:
   - Generate QR code for authenticator apps
   - Verify and enable 2FA
   - Disable 2FA
   - Show 2FA status with toggle

### Current State
- Server fully supports TOTP-based 2FA
- User model has `isTwoFactorEnabled` field (displayed in UI)
- No management interface exists

### Recommendation
Add 2FA settings page or section in user profile with:
- QR code generation
- Verification input
- Enable/disable toggle

---

## 3. PASSWORD RECOVERY GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `POST /api/password/forgot-password` | POST | ❌ Not Used | **GAP** |
| `POST /api/password/reset-password` | POST | ❌ Not Used | **GAP** |
| `GET /api/password/validate-token` | GET | ❌ Not Used | **GAP** |

### Client Has (Admin Only)
| Endpoint | HTTP | Client Uses | Notes |
|----------|------|-------------|-------|
| `POST /api/users/{id}/reset-password` | POST | ✅ Used | Admin resets for user |
| `POST /api/users/{id}/send-reset-link` | POST | ✅ Used | Admin sends link |

### Missing in Client UI
1. **Self-Service Password Recovery** - No UI for:
   - "Forgot Password?" link on login page
   - Password reset request form
   - Password reset form (with token from email)

### Current State
- Server fully supports email-based password reset
- Admin can reset passwords or send reset links
- Users cannot self-service reset

### Recommendation
Add:
- "Forgot Password?" link on login page
- `/forgot-password` page
- `/reset-password/:token` page

---

## 4. ACCOUNT SECURITY GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/account/status` | GET | ❌ Not Used | **GAP** |
| `POST /api/account/unlock` | POST | ✅ Used (via user lock toggle) | - |
| `POST /api/account/reset-attempts` | POST | ❌ Not Used | **GAP** |

### Missing in Client UI
1. **Account Status Page** - No dedicated security status view showing:
   - Lock status
   - Failed login attempts count
   - Remaining attempts before lockout
   - 2FA status
   - Last login time

2. **Reset Attempts Button** - No UI to reset failed login counter without unlocking

### Recommendation
Add security dashboard or account security section.

---

## 5. OAUTH/OIDC GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/oauth/authorize` | GET | ❌ Not Used | Expected - external apps use |
| `POST /api/oauth/token` | POST | ❌ Not Used | Expected - external apps use |
| `GET /api/oauth/userinfo` | GET | ❌ Not Used | **Potential** |
| `POST /api/oauth/revoke` | POST | ❌ Not Used | **GAP** |
| `GET /api/oauth/end_session` | GET | ✅ Used (logout) | - |
| `GET /.well-known/openid-configuration` | GET | ❌ Not Used | Expected - discovery |
| `GET /.well-known/jwks.json` | GET | ❌ Not Used | Expected - key verification |

### Missing in Client UI
1. **Token Revocation** - No UI to revoke OAuth tokens (refresh tokens)
2. **UserInfo Integration** - Could use for profile display

### Notes
Most OAuth endpoints are for external applications to integrate, not for admin UI.

---

## 6. USER MANAGEMENT GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/users` | GET | ✅ Used | - |
| `GET /api/users/{id}` | GET | ✅ Used | - |
| `POST /api/users` | POST | N/A (uses register) | - |
| `PUT /api/users/{id}` | PUT | ✅ Used | - |
| `DELETE /api/users/{id}` | DELETE | ✅ Used | - |
| `POST /api/users/bulk` | POST | ❌ Not Used | **GAP** |
| `GET /api/users/me/applications` | GET | ❌ Not Used | **GAP** |
| `POST /api/users/{id}/reset-password` | POST | ✅ Used | - |
| `POST /api/users/{id}/send-reset-link` | POST | ✅ Used | - |
| `PUT /api/users/{id}/lock-status` | PUT | ✅ Used | - |
| `GET /api/users/{id}/activity-logs` | GET | ✅ Used | - |
| `GET /api/users/{id}/roles` | GET | ✅ Used | - |
| `POST /api/users/{id}/roles` | POST | ✅ Used | - |
| `DELETE /api/users/{id}/roles/{roleId}` | DELETE | ✅ Used | - |

### Missing in Client UI
1. **Bulk User Import** - No UI for:
   - CSV/JSON upload
   - Bulk user creation form

2. **My Applications** - No UI showing applications accessible to current user

### Recommendation
Add bulk import feature to Users page with file upload.

---

## 7. ROLE MANAGEMENT - FULLY IMPLEMENTED ✅

All server endpoints are used by client:
- CRUD operations
- Permission management
- Bulk operations (POST /roles/bulk) - **Note: Not visible in UI**

### Minor Gap
- `POST /api/roles/bulk` endpoint exists but no bulk import UI

---

## 8. ORGANIZATION MANAGEMENT GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/organizations` | GET | ✅ Used | - |
| `GET /api/organizations/{id}` | GET | ✅ Used | - |
| `GET /api/organizations/{id}/tree` | GET | ✅ Used | - |
| `POST /api/organizations` | POST | ✅ Used | - |
| `PUT /api/organizations/{id}` | PUT | ✅ Used | - |
| `DELETE /api/organizations/{id}` | DELETE | ✅ Used | - |
| `GET /api/organizations/{id}/users` | GET | ✅ Used | - |
| `POST /api/organizations/{id}/users` | POST | ✅ Used | - |
| `DELETE /api/organizations/users/{userId}` | DELETE | ✅ Used | - |

### Status: FULLY IMPLEMENTED ✅

---

## 9. SESSION MANAGEMENT - FULLY IMPLEMENTED ✅

All relevant endpoints used:
- `GET /api/sessions/my`
- `DELETE /api/sessions/{sessionToken}`
- `DELETE /api/sessions/my/all`

### Admin Features Available but Not Exposed
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/sessions/stats` | GET | ❌ Not Used | **Optional** |
| `GET /api/sessions` | GET | ❌ Not Used | Admin feature |
| `DELETE /api/sessions/user/{userId}/all` | DELETE | ❌ Not Used | Admin feature |

### Recommendation
Add admin session management page showing all user sessions with stats.

---

## 10. MENU MANAGEMENT - MOSTLY IMPLEMENTED

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/menus` | GET | ✅ Used | - |
| `GET /api/menus/{id}` | GET | ✅ Used | - |
| `GET /api/menus/smart` | GET | ❌ Not Used | **GAP** |
| `POST /api/menus` | POST | ✅ Used | - |
| `POST /api/menus/bulk` | POST | ✅ Used | - |
| `PUT /api/menus/{id}` | PUT | ✅ Used | - |
| `DELETE /api/menus/{id}` | DELETE | ✅ Used | - |

### Missing in Client UI
1. **Smart Menu Integration** - The admin dashboard doesn't use the smart menu feature (permission-filtered navigation)

### Recommendation
Consider using smart menu API to dynamically show/hide sidebar items based on user permissions.

---

## 11. DASHBOARD GAPS

### Server Endpoint
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/dashboard/stats` | GET | ✅ Used | - |

### Current Implementation
- Shows: Total Tenants, Active Applications, Registered Users, System Roles
- Shows: Recent activity logs

### Potential Enhancements
- Add session statistics
- Add login attempt charts
- Add security alerts

---

## 12. PERMISSION MANAGEMENT GAPS

### Server Endpoints Available
| Endpoint | HTTP | Client Uses | Gap Status |
|----------|------|-------------|------------|
| `GET /api/permissions` | GET | ✅ Used | - |
| `POST /api/permissions` | POST | ✅ Used (in roles) | - |
| `DELETE /api/permissions/{id}` | DELETE | ✅ Used (in roles) | - |

### Status: FULLY IMPLEMENTED ✅

---

## PRIORITY GAP SUMMARY

### High Priority (User-Facing Features)
| Feature | Server Ready | Client Missing | Effort |
|---------|--------------|----------------|--------|
| Forgot Password Flow | ✅ | Login page link + reset pages | Medium |
| Email Verification UI | ✅ | Status + resend button | Low |
| 2FA Setup UI | ✅ | QR code + verify + toggle | Medium |

### Medium Priority (Admin Features)
| Feature | Server Ready | Client Missing | Effort |
|---------|--------------|----------------|--------|
| Bulk User Import | ✅ | File upload + preview | Medium |
| Admin Session Management | ✅ | All sessions view + stats | Low |
| Account Security Dashboard | ✅ | Status page | Low |

### Low Priority (Nice to Have)
| Feature | Server Ready | Client Missing | Effort |
|---------|--------------|----------------|--------|
| Smart Menu Integration | ✅ | Dynamic sidebar | Medium |
| My Applications View | ✅ | User's apps list | Low |
| Bulk Role Import UI | ✅ | Already has endpoint | Low |

---

## FULLY TESTABLE FLOWS (End-to-End)

These features have complete server + client implementation:

### 1. Authentication Flow ✅
- User login with email/password
- Token refresh on expiry
- Logout with session cleanup

### 2. Tenant Management Flow ✅
- Create tenant
- List tenants
- Edit tenant
- Delete tenant

### 3. Application Management Flow ✅
- Create OAuth application (get credentials)
- List applications
- Edit application
- Regenerate client secret
- Delete application

### 4. User Management Flow ✅
- Create user (via register endpoint)
- List users with tenant filter
- View user details
- Edit user profile
- Lock/unlock account
- Admin password reset
- Send password reset link
- View activity logs
- Delete user

### 5. Role & Permission Flow ✅
- Create role with permissions
- Assign permissions to role
- Remove permissions from role
- Delete role

### 6. User-Role Assignment Flow ✅
- View user's roles
- Assign role to user
- Remove role from user

### 7. Menu Management Flow ✅
- Create menu items
- Set parent-child hierarchy
- Bulk import from JSON
- Edit menu items
- Delete menu items

### 8. Organization Management Flow ✅
- Create organization
- Set parent organization (hierarchy)
- View organization tree
- Assign users to organization
- Remove users from organization
- Delete organization

### 9. Session Management Flow ✅
- View active sessions
- Revoke individual session
- Revoke all sessions

---

## PARTIALLY TESTABLE FLOWS

### 1. Password Reset (Admin-Only) ⚠️
- ✅ Admin can reset user password
- ✅ Admin can send reset link
- ❌ User cannot self-service reset (no UI)

### 2. Email Verification ⚠️
- ✅ Server sends verification email on register
- ❌ No UI to show status or resend

### 3. 2FA ⚠️
- ✅ Login supports 2FA code entry
- ❌ No UI to enable/disable 2FA

---

## NOT TESTABLE (Missing Client UI)

1. **Self-Service Password Recovery** - Entire flow missing
2. **2FA Setup/Management** - Enable, QR code, disable
3. **Bulk User Import** - Server ready, no UI
4. **Admin Session Overview** - All sessions, stats

---

## NEXT STEPS

### Immediate Actions
1. Add "Forgot Password?" link and pages
2. Add 2FA management in user settings
3. Add email verification status to user details

### Short-Term
1. Add bulk user import feature
2. Add admin session management page
3. Integrate smart menu for dynamic navigation

### Documentation
1. Update API documentation with examples
2. Create user guide for each flow
3. Add integration testing guide
