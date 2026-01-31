# DoorAuth Feature Inventory

**Generated:** 2026-01-30
**Purpose:** Complete inventory of all features in Server and Client

---

## Server API - Complete Feature List

### Authentication Module (8 endpoints)
| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/auth/register` | POST | User registration | 3/hour |
| `/api/auth/login` | POST | User login (supports 2FA) | 5/15min |
| `/api/auth/logout` | POST | Logout, blacklist token | - |
| `/api/auth/refresh` | POST | Refresh JWT token | - |
| `/api/auth/verify-email` | POST | Verify email with token | - |
| `/api/auth/verify-email/:token` | GET | Verify email via link | - |
| `/api/auth/resend-verification` | POST | Resend verification email | - |
| `/api/auth/verification-status` | GET | Check verification status | - |

### Two-Factor Authentication (3 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/2fa/generate` | POST | Generate TOTP secret + QR code |
| `/api/2fa/verify` | POST | Verify and enable 2FA |
| `/api/2fa/disable` | POST | Disable 2FA |

### Password Recovery (3 endpoints)
| Endpoint | Method | Description | Rate Limit |
|----------|--------|-------------|------------|
| `/api/password/forgot-password` | POST | Request password reset email | 3/hour |
| `/api/password/reset-password` | POST | Reset with token | - |
| `/api/password/validate-token` | GET | Validate reset token | - |

### Account Security (3 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/account/status` | GET | Get security status |
| `/api/account/unlock` | POST | Unlock user account |
| `/api/account/reset-attempts` | POST | Reset failed login counter |

### OAuth 2.0 / OIDC (7 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/oauth/authorize` | GET | Authorization endpoint (PKCE) |
| `/api/oauth/token` | POST | Token exchange |
| `/api/oauth/userinfo` | GET | OIDC UserInfo |
| `/api/oauth/revoke` | POST | Revoke refresh token |
| `/api/oauth/end_session` | GET | OIDC logout |
| `/.well-known/openid-configuration` | GET | OIDC discovery |
| `/.well-known/jwks.json` | GET | Public keys (JWKS) |

### User Management (12 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | List users |
| `/api/users/:id` | GET | Get user |
| `/api/users/:id` | PUT | Update user |
| `/api/users/:id` | DELETE | Delete user |
| `/api/users/bulk` | POST | Bulk create users |
| `/api/users/me/applications` | GET | Get user's applications |
| `/api/users/:id/reset-password` | POST | Admin reset password |
| `/api/users/:id/send-reset-link` | POST | Send reset email |
| `/api/users/:id/lock-status` | PUT | Lock/unlock account |
| `/api/users/:id/activity-logs` | GET | Get activity logs |
| `/api/users/:id/roles` | GET | Get user's roles |
| `/api/users/:id/roles` | POST | Assign role |
| `/api/users/:id/roles/:roleId` | DELETE | Remove role |

### Role Management (8 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/roles` | GET | List roles |
| `/api/roles/:id` | GET | Get role with permissions |
| `/api/roles` | POST | Create role |
| `/api/roles/bulk` | POST | Bulk create roles |
| `/api/roles/:id` | PUT | Update role |
| `/api/roles/:id` | DELETE | Delete role |
| `/api/roles/:id/permissions` | POST | Add permission |
| `/api/roles/:id/permissions/:permissionId` | DELETE | Remove permission |

### Permission Management (1 endpoint)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/permissions` | GET | List all permissions |

### Tenant Management (5 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tenants` | GET | List tenants (public) |
| `/api/tenants/:id` | GET | Get tenant (public) |
| `/api/tenants` | POST | Create tenant |
| `/api/tenants/:id` | PUT | Update tenant |
| `/api/tenants/:id` | DELETE | Delete tenant |

### Application Management (6 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applications` | GET | List applications |
| `/api/applications/:id` | GET | Get application |
| `/api/applications` | POST | Create (returns secret) |
| `/api/applications/:id` | PUT | Update application |
| `/api/applications/:id/regenerate-secret` | POST | Rotate secret |
| `/api/applications/:id` | DELETE | Delete application |

### Organization Management (9 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/organizations` | GET | List organizations |
| `/api/organizations/:id` | GET | Get organization |
| `/api/organizations/:id/tree` | GET | Get org tree |
| `/api/organizations` | POST | Create organization |
| `/api/organizations/:id` | PUT | Update organization |
| `/api/organizations/:id` | DELETE | Delete organization |
| `/api/organizations/:id/users` | GET | List org users |
| `/api/organizations/:id/users` | POST | Assign user |
| `/api/organizations/users/:userId` | DELETE | Remove user |

### Menu Management (7 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/menus` | GET | List menus |
| `/api/menus/:id` | GET | Get menu |
| `/api/menus/smart` | GET | Permission-filtered menus |
| `/api/menus` | POST | Create menu |
| `/api/menus/bulk` | POST | Bulk create menus |
| `/api/menus/:id` | PUT | Update menu |
| `/api/menus/:id` | DELETE | Delete menu |

### Session Management (6 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions/my` | GET | Get user's sessions |
| `/api/sessions/stats` | GET | Session statistics (admin) |
| `/api/sessions` | GET | All sessions (admin) |
| `/api/sessions/my/all` | DELETE | Revoke all user sessions |
| `/api/sessions/:sessionToken` | DELETE | Revoke specific session |
| `/api/sessions/user/:userId/all` | DELETE | Revoke user's sessions (admin) |

### Dashboard (1 endpoint)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Dashboard statistics |

**Total Server Endpoints: 80+**

---

## Client UI - Complete Feature List

### Pages Implemented (9 pages)

| Route | Page | Features |
|-------|------|----------|
| `/login` | Login | Email/password auth |
| `/` | Dashboard | Stats cards, activity logs |
| `/tenants` | Tenants | CRUD, search |
| `/applications` | Applications | CRUD, credentials, regenerate secret |
| `/users` | Users | CRUD, lock/unlock, password reset, activity |
| `/roles` | Roles | CRUD with permission matrix |
| `/user-roles` | User Roles | Assign/remove roles |
| `/menus` | Menus | CRUD, hierarchy, bulk import |
| `/organizations` | Organizations | CRUD, tree view, user assignment |
| `/sessions` | Sessions | View/revoke sessions |

### UI Components
- Dashboard layout with sidebar
- Data tables with search/filter
- Create/Edit dialogs (modals)
- Form validation (Zod + React Hook Form)
- Toast notifications
- Confirmation dialogs (SweetAlert)
- Copy-to-clipboard functionality
- File upload (JSON import)
- Tree view visualization

### State Management
- Auth Context (user, tokens)
- Theme Context (dark/light)
- Toast Context (notifications)

### API Integration
- Axios HTTP client
- Bearer token auth
- Automatic token refresh
- Request/response interceptors
- Error handling with redirect

---

## Feature Comparison Matrix

| Feature | Server API | Client UI | Status |
|---------|------------|-----------|--------|
| **Authentication** |
| Login | ✅ | ✅ | Complete |
| Logout | ✅ | ✅ | Complete |
| Token Refresh | ✅ | ✅ | Complete |
| Register | ✅ | ✅ (via user create) | Complete |
| Email Verification | ✅ | ❌ | Gap |
| **2FA** |
| Generate QR | ✅ | ❌ | Gap |
| Enable/Disable | ✅ | ❌ | Gap |
| Login with 2FA | ✅ | ✅ | Complete |
| **Password** |
| Admin Reset | ✅ | ✅ | Complete |
| Send Reset Link | ✅ | ✅ | Complete |
| Self-Service Reset | ✅ | ❌ | Gap |
| **Tenants** |
| CRUD | ✅ | ✅ | Complete |
| Search | ✅ | ✅ | Complete |
| **Applications** |
| CRUD | ✅ | ✅ | Complete |
| Regenerate Secret | ✅ | ✅ | Complete |
| Copy Credentials | N/A | ✅ | Complete |
| **Users** |
| CRUD | ✅ | ✅ | Complete |
| Bulk Create | ✅ | ❌ | Gap |
| Lock/Unlock | ✅ | ✅ | Complete |
| Activity Logs | ✅ | ✅ | Complete |
| My Applications | ✅ | ❌ | Gap |
| **Roles** |
| CRUD | ✅ | ✅ | Complete |
| Permission Matrix | ✅ | ✅ | Complete |
| Bulk Create | ✅ | ❌ | Gap |
| **User-Roles** |
| Assign/Remove | ✅ | ✅ | Complete |
| **Organizations** |
| CRUD | ✅ | ✅ | Complete |
| Hierarchy/Tree | ✅ | ✅ | Complete |
| User Assignment | ✅ | ✅ | Complete |
| **Menus** |
| CRUD | ✅ | ✅ | Complete |
| Bulk Import | ✅ | ✅ | Complete |
| Smart Menu | ✅ | ❌ | Gap |
| **Sessions** |
| View | ✅ | ✅ | Complete |
| Revoke | ✅ | ✅ | Complete |
| Admin View All | ✅ | ❌ | Gap |
| **Dashboard** |
| Statistics | ✅ | ✅ | Complete |
| Activity Feed | ✅ | ✅ | Complete |
| **OAuth/OIDC** |
| Authorization | ✅ | N/A | External use |
| Token Exchange | ✅ | N/A | External use |
| UserInfo | ✅ | ❌ | Optional |
| End Session | ✅ | ✅ | Complete |
| Discovery | ✅ | N/A | External use |

---

## Database Models

### Core Entities
| Model | Fields | Relations |
|-------|--------|-----------|
| **Tenant** | id, name, domain, timestamps | Users, Orgs, Apps, Roles |
| **User** | id, loginId, email, userName, passwordHash, company, designation, contact, address, isLocked, isApproved, isTwoFactorEnabled, twoFactorSecret, emailVerified, isPassExpired, passAttemptCount, lastLoginTime | Tenant, Roles, Sessions, Orgs |
| **Application** | id, name, clientId, clientSecret, redirectUris, description, appUrl | Tenant, Menus, Roles |
| **Role** | id, name, description, isSystem, status | Tenant, App, Permissions, Users |
| **Permission** | id, resource, action | Roles |
| **Menu** | id, label, path, icon, order, requiredPermission | App, Parent, Children |
| **Organization** | id, name, description | Tenant, Parent, Children, Users |

### Security Entities
| Model | Purpose |
|-------|---------|
| **Session** | Multi-device session tracking |
| **TokenBlacklist** | Revoked token tracking |
| **AuthorizationCode** | OAuth auth code storage |
| **RefreshToken** | OAuth refresh token storage |
| **PassToken** | Password reset tokens |
| **EmailVerification** | Email verification tokens |
| **AuditLog** | Activity audit trail |

---

## Security Features Implemented

### Authentication Security
- ✅ JWT with HttpOnly cookies
- ✅ Bcrypt password hashing
- ✅ TOTP 2FA support
- ✅ PKCE for OAuth
- ✅ Token blacklisting
- ✅ Session management

### Authorization Security
- ✅ Multi-tenant isolation
- ✅ RBAC with permissions
- ✅ Permission middleware
- ✅ Cross-tenant prevention

### Rate Limiting
| Limiter | Window | Limit |
|---------|--------|-------|
| Auth | 15 min | 5 |
| Register | 1 hour | 3 |
| Password Reset | 1 hour | 3 |
| 2FA | 15 min | 10 |
| OAuth | 5 min | 20 |
| API | 1 min | 100 |

---

## Middleware Stack

| Middleware | Purpose |
|------------|---------|
| `authMiddleware` | JWT verification, blacklist check |
| `optionalAuthMiddleware` | Optional JWT (public routes) |
| `permissionMiddleware` | RBAC permission checks |
| `tenantScopeMiddleware` | Multi-tenant data isolation |
| `rateLimiter` | Request throttling |

---

## Technology Stack Summary

### Server
- Node.js 18+ / TypeScript 5
- Express.js 4.18
- Prisma ORM 5.10
- JWT / bcrypt / speakeasy
- Nodemailer
- Swagger/OpenAPI

### Client
- React 19 / TypeScript
- Vite 7
- Tailwind CSS 4
- React Hook Form / Zod
- Axios
- React Router 7

### Testing
- Jest 30
- Supertest 7
- ts-jest

---

## Quick Reference: API Base URL

```
Development: https://localhost:3000/api
Production: https://your-domain.com/api
```

## Quick Reference: Default Credentials

```
Email: bd@gmail.com
Password: 1q2w3E*
Tenant: Default (ID: 1)
```
