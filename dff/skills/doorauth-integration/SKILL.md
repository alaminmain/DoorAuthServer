---
name: DoorAuth Integration
description: Complete guide for integrating DoorAuth SSO authentication system into applications. Covers OAuth 2.0/OIDC, multi-tenancy, RBAC, and session management.
---

# DoorAuth Integration Skill

## Overview

DoorAuth is a production-ready, self-hosted **Central Authentication & Authorization System** (IdP) with Multi-Tenancy, OAuth 2.0/OIDC SSO, RBAC, and Dynamic Menu Management.

This skill provides comprehensive guidance for integrating DoorAuth into any application, understanding its architecture, and leveraging its features.

---

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    DoorAuth Ecosystem                        │
└─────────────────────────────────────────────────────────────┘

                     ┌──────────────────────┐
                     │   DoorAuth Server    │
                     │   (localhost:3000)   │
                     │                      │
                     │  ┌────────────────┐  │
                     │  │  Database      │  │
                     │  │  - Users       │  │
                     │  │  - Tenants     │  │
                     │  │  - Apps        │  │
                     │  │  - Roles       │  │
                     │  │  - Sessions    │  │
                     │  └────────────────┘  │
                     │                      │
                     │  OAuth 2.0 / OIDC    │
                     └──────────┬───────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
         ┌───────▼──────┐  ┌───▼────────┐  ┌─▼──────────┐
         │ Admin Panel  │  │ Your Apps  │  │ 3rd Party  │
         │ (React)      │  │ (Any)      │  │ Apps       │
         └──────────────┘  └────────────┘  └────────────┘
```

### Technology Stack

**Backend (Server)**:
- Runtime: Node.js 18+ with TypeScript
- Framework: Express.js
- Database: Prisma ORM (SQLite/PostgreSQL)
- Authentication: JWT, bcrypt, speakeasy (TOTP)
- Email: Nodemailer
- Documentation: Swagger/OpenAPI 3.0

**Frontend (Client)**:
- Framework: React 18 with TypeScript
- Build Tool: Vite
- Styling: TailwindCSS v4
- HTTP Client: Axios
- Routing: React Router v7
- Forms: React Hook Form + Zod

---

## Key Features

### Authentication & Authorization
- ✅ Multi-Tenant Architecture with complete isolation
- ✅ OAuth 2.0 / OIDC Provider with PKCE security
- ✅ Single Sign-On (SSO) - Login once, access all apps
- ✅ Single Sign-Out - Logout from one app logs out from all
- ✅ Two-Factor Authentication (2FA) with TOTP
- ✅ Password Recovery via email
- ✅ Account Security (brute force protection, account locking)
- ✅ RBAC (Role-Based Access Control)
- ✅ Smart Menus (permission-filtered dynamic navigation)
- ✅ Session Management with device tracking
- ✅ Token Blacklisting for revoked tokens
- ✅ Email Verification

### Management Features
- ✅ Tenant Management (CRUD)
- ✅ Application Management (OIDC clients)
- ✅ User Management
- ✅ Role & Permission Management
- ✅ Menu Management (hierarchical)
- ✅ Organization Hierarchy
- ✅ Audit Logging
- ✅ Session Monitoring

---

## Database Schema

### Core Models

**Tenant**
- Multi-tenant isolation
- Branding configuration
- Owns: Users, Applications, Roles, Organizations

**User**
- Unique per tenant (loginId, email)
- Password hashing with bcrypt
- 2FA support
- Email verification
- Account locking mechanism
- Session tracking

**Organization**
- Hierarchical structure (self-referencing)
- Tenant-scoped
- User assignment

**Application**
- OAuth/OIDC client registration
- ClientId & ClientSecret
- Redirect URIs
- Tenant-scoped

**Role**
- Tenant and/or Application-scoped
- System roles vs custom roles
- Permission assignments

**Permission**
- Resource-action pairs (e.g., "payroll:read")
- Attached to roles

**Menu**
- Hierarchical navigation structure
- Permission-based filtering
- Application-scoped

**Session**
- Device and browser tracking
- IP address logging
- Active session management
- Revocation support

**AuthorizationCode**
- OAuth authorization code flow
- PKCE support (code_challenge)
- Single-use codes

**RefreshToken**
- Long-lived tokens
- Revocation support

**TokenBlacklist**
- Revoked token tracking
- JTI (JWT ID) indexing
- Expiration cleanup

**EmailVerification**
- Email verification tokens
- Expiration tracking

---

## API Endpoints

### Authentication (3)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout and clear session

### Two-Factor Authentication (3)
- `POST /api/2fa/generate` - Generate 2FA secret
- `POST /api/2fa/verify` - Verify and enable 2FA
- `POST /api/2fa/disable` - Disable 2FA

### Password Recovery (3)
- `POST /api/password/forgot-password` - Request password reset
- `POST /api/password/reset-password` - Reset password with token
- `GET /api/password/validate-token` - Validate reset token

### Email Verification (2)
- `POST /api/email/send-verification` - Send verification email
- `POST /api/email/verify` - Verify email with token

### Account Security (3)
- `GET /api/account/status` - Get account status
- `POST /api/account/unlock` - Unlock locked account
- `POST /api/account/reset-attempts` - Reset failed login attempts

### OAuth/OIDC (5)
- `GET /api/oauth/authorize` - Authorization endpoint
- `POST /api/oauth/token` - Token exchange
- `GET /api/oauth/userinfo` - User information
- `POST /api/oauth/revoke` - Revoke refresh token
- `GET /api/oauth/end_session` - SSO logout endpoint

### OIDC Discovery (2)
- `GET /.well-known/openid-configuration` - OIDC metadata
- `GET /.well-known/jwks.json` - Public keys (JWKS)

### Session Management (4)
- `GET /api/sessions` - List user sessions
- `GET /api/sessions/active` - Get active sessions
- `DELETE /api/sessions/:id` - Revoke specific session
- `DELETE /api/sessions/all` - Revoke all sessions

### Tenant Management (5)
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Application Management (6)
- `GET /api/applications` - List applications
- `GET /api/applications/:id` - Get application
- `POST /api/applications` - Register new application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `POST /api/applications/:id/regenerate-secret` - Regenerate client secret

### Role Management (7)
- `GET /api/roles` - List roles
- `GET /api/roles/:id` - Get role details
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/permissions` - Add permission to role
- `DELETE /api/roles/:id/permissions/:permissionId` - Remove permission

### User Management (6)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:userId/roles/:roleId` - Assign role to user

### Menu Management (6)
- `GET /api/menus` - List all menus
- `GET /api/menus/smart` - Smart menu (filtered by user permissions)
- `GET /api/menus/:id` - Get menu item
- `POST /api/menus` - Create menu item
- `PUT /api/menus/:id` - Update menu item
- `DELETE /api/menus/:id` - Delete menu item

### Organization Management (5)
- `GET /api/organizations` - List organizations
- `GET /api/organizations/:id` - Get organization
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Dashboard (1)
- `GET /api/dashboard/stats` - Get dashboard statistics

**Total: 60+ Endpoints** - All documented in Swagger UI at `/api-docs`

---

## Integration Guide

### Prerequisites
- Node.js 18+
- Database (PostgreSQL or SQLite)
- HTTPS certificates (for development)

### Quick Start

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Setup Database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

3. **Generate SSL Certificates**
   ```bash
   npm run generate-certs
   ```

4. **Start Server**
   ```bash
   npm run dev
   ```

5. **Start Admin Client**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

### Access Points
- **API Server**: https://localhost:3000
- **Admin Dashboard**: https://localhost:3000 (proxied to React)
- **Swagger UI**: https://localhost:3000/api-docs
- **OIDC Discovery**: https://localhost:3000/.well-known/openid-configuration

### Default Credentials
```
Email: bd@gmail.com
Password: 1q2w3E*
Tenant: Default (ID: 1)
```

---

## Integration Patterns

### Pattern 1: ASP.NET Core / Blazor (OIDC)

**Use Case**: Server-side web applications

**Configuration**:
```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme)
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    options.Authority = "https://localhost:3000";
    options.ClientId = "your-client-id";
    options.ClientSecret = "your-client-secret";
    options.ResponseType = "code";
    options.UsePkce = true;
    
    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Logout configuration
    options.SignedOutRedirectUri = "/";
    
    // Development only - bypass certificate validation
    options.BackchannelHttpHandler = new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = 
            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
    };
    
    // Cookie settings for SSO
    options.NonceCookie.SameSite = SameSiteMode.None;
    options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
    options.CorrelationCookie.SameSite = SameSiteMode.None;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
});
```

**Logout Implementation**:
```csharp
public async Task<IActionResult> OnPostLogoutAsync()
{
    // Sign out from local application
    await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    
    // Redirect to DoorAuth logout endpoint for SSO logout
    var properties = new AuthenticationProperties
    {
        RedirectUri = Url.Page("/Index", null, null, Request.Scheme)
    };
    
    return SignOut(properties, OpenIdConnectDefaults.AuthenticationScheme);
}
```

### Pattern 2: React SPA (OAuth 2.0 PKCE)

**Use Case**: Single-page applications

**Key Features**:
- Authorization Code Flow with PKCE
- Token storage in memory (not localStorage)
- Automatic token refresh
- Silent authentication

**Implementation**:
```typescript
// PKCE helpers
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

// Authorization request
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

sessionStorage.setItem('code_verifier', codeVerifier);

const authUrl = new URL('https://localhost:3000/api/oauth/authorize');
authUrl.searchParams.set('client_id', 'your-client-id');
authUrl.searchParams.set('redirect_uri', 'http://localhost:5175/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

window.location.href = authUrl.toString();

// Token exchange
const codeVerifier = sessionStorage.getItem('code_verifier');
const response = await fetch('https://localhost:3000/api/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: 'http://localhost:5175/callback',
    client_id: 'your-client-id',
    code_verifier: codeVerifier!
  })
});
```

### Pattern 3: Direct API Integration (JWT)

**Use Case**: Admin panels, internal tools

**Configuration**:
```typescript
// Axios instance with interceptors
const api = axios.create({
  baseURL: 'https://localhost:3000/api',
  withCredentials: true, // Include cookies
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Development only
  })
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Security Best Practices

### 1. Token Management
- **Access Tokens**: Short-lived (15 minutes)
- **Refresh Tokens**: Long-lived (7 days), stored securely
- **ID Tokens**: Contains user claims, verify signature
- **Token Blacklisting**: Revoke tokens on logout

### 2. Cookie Security
```typescript
// Production cookie settings
{
  httpOnly: true,      // Prevent XSS
  secure: true,        // HTTPS only
  sameSite: 'none',    // Cross-site SSO
  maxAge: 900000,      // 15 minutes
  path: '/'
}
```

### 3. PKCE Implementation
- Always use PKCE for public clients
- Generate cryptographically secure code_verifier
- Use SHA-256 for code_challenge
- Never expose code_verifier in URLs

### 4. HTTPS Enforcement
- Development: Use self-signed certificates
- Production: Use valid SSL certificates
- Never bypass certificate validation in production

### 5. Session Management
- Track active sessions per user
- Implement session timeout
- Allow users to revoke sessions
- Log session activity

### 6. Password Security
- Bcrypt with salt rounds ≥ 10
- Password complexity requirements
- Account locking after failed attempts
- Password reset via email only

### 7. Multi-Tenant Isolation
- Always filter by tenantId
- Validate tenant access in middleware
- Separate data at database level
- Audit cross-tenant access attempts

---

## Common Integration Scenarios

### Scenario 1: Adding SSO to Existing App

**Steps**:
1. Register application in DoorAuth
2. Install OIDC middleware
3. Configure authentication
4. Update login/logout flows
5. Protect routes with `[Authorize]`
6. Test SSO with multiple apps

**Time**: 1-2 hours

### Scenario 2: Building Multi-Tenant SaaS

**Steps**:
1. Create tenant during signup
2. Assign users to tenants
3. Filter all queries by tenantId
4. Implement tenant-specific branding
5. Create tenant admin role
6. Test tenant isolation

**Time**: 4-8 hours

### Scenario 3: Implementing RBAC

**Steps**:
1. Define roles for your application
2. Create permissions (resource:action)
3. Assign permissions to roles
4. Assign roles to users
5. Check permissions in controllers
6. Filter UI based on permissions

**Time**: 2-4 hours

### Scenario 4: Dynamic Menu System

**Steps**:
1. Create menu structure in DoorAuth
2. Assign permissions to menu items
3. Fetch smart menu from API
4. Render menu dynamically
5. Filter based on user permissions
6. Handle hierarchical menus

**Time**: 2-3 hours

---

## Testing Guide

### Unit Tests
```bash
npm run test:unit
```

**Coverage**:
- Services: 100%
- Controllers: 90%
- Utilities: 100%

### Integration Tests
```bash
npm run test:integration
```

**Scenarios**:
- User registration and login
- OAuth authorization flow
- Token exchange
- Session management
- Multi-tenant isolation

### E2E Tests
```bash
npm run test:e2e
```

**Flows**:
- Complete SSO login
- SSO logout across apps
- 2FA enrollment and verification
- Password recovery
- Session revocation

### Manual Testing Checklist

**Authentication**:
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] 2FA works correctly
- [ ] Password reset works
- [ ] Email verification works

**SSO**:
- [ ] Login to App A
- [ ] Navigate to App B (auto-login)
- [ ] Logout from App B
- [ ] Verify logged out from App A

**Authorization**:
- [ ] Protected routes require auth
- [ ] Roles are enforced
- [ ] Permissions are checked
- [ ] Menus filter by permissions

**Session Management**:
- [ ] Sessions are created on login
- [ ] Sessions can be viewed
- [ ] Sessions can be revoked
- [ ] Expired sessions are cleaned up

---

## Troubleshooting

### Issue: "Correlation failed"
**Cause**: Cookie SameSite/Secure settings  
**Fix**: Set `SameSite=None` and `Secure=true` on OIDC cookies

### Issue: "Cannot redirect to end session endpoint"
**Cause**: Missing EndSessionEndpoint configuration  
**Fix**: Explicitly set `EndSessionEndpoint` in OIDC options

### Issue: Certificate errors
**Cause**: Self-signed certificates in development  
**Fix**: Add `ServerCertificateCustomValidationCallback` (dev only)

### Issue: "invalid_grant"
**Cause**: Expired authorization code or wrong client secret  
**Fix**: Verify ClientSecret, check code expiration (5 minutes)

### Issue: User not authenticated after login
**Cause**: Middleware order incorrect  
**Fix**: Ensure `UseAuthentication()` before `UseAuthorization()`

### Issue: SSO not working
**Cause**: Cookies not shared across domains  
**Fix**: Ensure all apps use same domain or proper SameSite settings

### Issue: Logout not working across apps
**Cause**: Not using centralized logout endpoint  
**Fix**: Redirect to `/api/oauth/end_session` with proper parameters

---

## Production Deployment

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/doorauth

# JWT
JWT_SECRET=your-secure-random-secret-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION=30m
```

### Pre-Deployment Checklist

**Security**:
- [ ] Change all default secrets
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS with valid certificates
- [ ] Remove certificate bypass code
- [ ] Enable token validation
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Configure CORS properly

**Database**:
- [ ] Use PostgreSQL (not SQLite)
- [ ] Enable connection pooling
- [ ] Set up backups
- [ ] Run migrations
- [ ] Seed initial data

**Monitoring**:
- [ ] Add logging (Winston, Pino)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor performance (New Relic, DataDog)
- [ ] Track authentication metrics
- [ ] Set up alerts

**Performance**:
- [ ] Enable caching (Redis)
- [ ] Optimize database queries
- [ ] Add indexes
- [ ] Enable compression
- [ ] Use CDN for static assets

---

## Architecture Decisions

### Why Multi-Tenant?
- **Isolation**: Complete data separation per tenant
- **Scalability**: Single deployment serves multiple customers
- **Efficiency**: Shared infrastructure, lower costs
- **Flexibility**: Per-tenant customization

### Why OAuth 2.0 / OIDC?
- **Standard**: Industry-standard protocol
- **Interoperability**: Works with any OAuth client
- **Security**: PKCE, token rotation, scope-based access
- **Flexibility**: Multiple grant types

### Why JWT?
- **Stateless**: No server-side session storage
- **Scalable**: Horizontal scaling without session sharing
- **Standard**: RFC 7519, widely supported
- **Flexible**: Custom claims, expiration control

### Why Prisma?
- **Type Safety**: TypeScript integration
- **Migrations**: Version-controlled schema changes
- **Developer Experience**: Intuitive API
- **Performance**: Optimized queries

### Why React + Vite?
- **Modern**: Latest React features
- **Fast**: Vite's instant HMR
- **TypeScript**: Type safety in frontend
- **Ecosystem**: Rich component libraries

---

## File Structure Reference

```
server/
├── src/
│   ├── controllers/       # Request handlers (15 files)
│   │   ├── auth.controller.ts
│   │   ├── oauth.controller.ts
│   │   ├── session.controller.ts
│   │   ├── tenant.controller.ts
│   │   ├── application.controller.ts
│   │   ├── role.controller.ts
│   │   ├── user.controller.ts
│   │   ├── menu.controller.ts
│   │   ├── organization.controller.ts
│   │   ├── twoFactor.controller.ts
│   │   ├── passwordRecovery.controller.ts
│   │   ├── emailVerification.controller.ts
│   │   ├── accountSecurity.controller.ts
│   │   ├── permission.controller.ts
│   │   └── dashboard.controller.ts
│   │
│   ├── services/          # Business logic (11 files)
│   │   ├── auth.service.ts
│   │   ├── oauth.service.ts
│   │   ├── session.service.ts
│   │   ├── user.service.ts
│   │   ├── organization.service.ts
│   │   ├── twoFactor.service.ts
│   │   ├── passwordRecovery.service.ts
│   │   ├── emailVerification.service.ts
│   │   ├── tokenBlacklist.service.ts
│   │   ├── email.service.ts
│   │   └── jwks.service.ts
│   │
│   ├── routes/            # API routes (16 files)
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── oauth.routes.ts
│   │   ├── session.routes.ts
│   │   ├── tenant.routes.ts
│   │   ├── application.routes.ts
│   │   ├── role.routes.ts
│   │   ├── user.routes.ts
│   │   ├── menu.routes.ts
│   │   ├── organization.routes.ts
│   │   ├── twoFactor.routes.ts
│   │   ├── passwordRecovery.routes.ts
│   │   ├── emailVerification.routes.ts
│   │   ├── accountSecurity.routes.ts
│   │   ├── permission.routes.ts
│   │   ├── dashboard.routes.ts
│   │   └── well-known.routes.ts
│   │
│   ├── middlewares/       # Express middleware (5 files)
│   │   ├── auth.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   ├── errorHandler.ts
│   │   ├── validateRequest.ts
│   │   └── rateLimiter.ts
│   │
│   ├── config/            # Configuration (2 files)
│   │   ├── swagger.ts
│   │   └── database.ts
│   │
│   ├── utils/             # Utilities (2 files)
│   │   ├── Logger.ts
│   │   └── helpers.ts
│   │
│   ├── app.ts             # Express app setup
│   └── index.ts           # Server entry point
│
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration files
│   └── seed.ts            # Seed data
│
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
│
├── scripts/               # Utility scripts
│   └── generate-certs.js  # SSL certificate generation
│
└── package.json

client/
├── src/
│   ├── components/        # React components
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── tenants/
│   │   ├── applications/
│   │   ├── roles/
│   │   ├── menus/
│   │   ├── users/
│   │   └── ui/
│   │
│   ├── pages/             # Page components (9 files)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Tenants.tsx
│   │   ├── Applications.tsx
│   │   ├── Roles.tsx
│   │   ├── Menus.tsx
│   │   ├── Users.tsx
│   │   ├── UserRoles.tsx
│   │   └── Sessions.tsx
│   │
│   ├── services/          # API services (9 files)
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── tenant.service.ts
│   │   ├── application.service.ts
│   │   ├── role.service.ts
│   │   ├── menu.service.ts
│   │   ├── user.service.ts
│   │   ├── session.service.ts
│   │   └── dashboard.service.ts
│   │
│   ├── contexts/          # React contexts (3 files)
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   │
│   ├── utils/             # Utilities (3 files)
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
│
└── package.json
```

---

## Quick Reference Commands

### Development
```bash
# Server
cd server
npm run dev              # Start dev server
npm run generate-certs   # Generate SSL certs
npm run seed:admin       # Seed admin user
npx prisma studio        # Open Prisma Studio

# Client
cd client
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
npm run test:coverage    # Coverage report
```

### Database
```bash
npx prisma migrate dev   # Create and apply migration
npx prisma migrate reset # Reset database
npx prisma db seed       # Seed database
npx prisma generate      # Generate Prisma Client
npx prisma studio        # Open database GUI
```

---

## Additional Resources

### Documentation
- Main README: `/README.md`
- Integration Guide: `/DOORAUTH_INTEGRATION_GUIDE.md`
- Quick Reference: `/DOORAUTH_QUICK_REFERENCE.md`
- Flow Diagrams: `/DOORAUTH_FLOW_DIAGRAMS.md`
- API Docs: `https://localhost:3000/api-docs`

### Example Applications
- **DoorAuthSample**: ASP.NET Core Razor Pages with OIDC
- **client_todo**: React SPA with OAuth 2.0 PKCE
- **client**: React Admin Panel with JWT

### External Links
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [OpenID Connect Specification](https://openid.net/connect/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

## Support and Maintenance

### Getting Help
1. Check Swagger documentation at `/api-docs`
2. Review troubleshooting section above
3. Compare with example applications
4. Check server logs for errors
5. Enable debug logging in appsettings

### Contributing
- Write tests for new features
- Follow TypeScript best practices
- Update documentation
- Ensure all tests pass
- Follow commit message conventions

### Version History
- **v1.0.0** (2026-01-01): Initial release
  - Complete OAuth/OIDC implementation
  - Multi-tenant support
  - RBAC and dynamic menus
  - Session management
  - Email verification
  - Token blacklisting

---

**Built with ❤️ for developers who need production-ready authentication**
