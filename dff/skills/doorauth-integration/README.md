# DoorAuth Integration Skill

This skill provides comprehensive documentation and guidance for integrating the DoorAuth SSO authentication system into any application.

## 📚 Documentation Files

### 1. **SKILL.md** (Main Documentation)
Complete reference guide covering:
- System architecture and components
- Database schema and models
- All API endpoints (60+)
- Integration patterns for different frameworks
- Security best practices
- Common scenarios and use cases
- Troubleshooting guide
- Production deployment checklist

**When to use**: Comprehensive reference for understanding DoorAuth architecture and capabilities.

### 2. **API_REFERENCE.md** (API Documentation)
Quick reference for all API endpoints with:
- Request/response examples
- Authentication requirements
- Error responses
- Rate limiting information
- Pagination details

**When to use**: Quick lookup for API endpoint details and request formats.

### 3. **INTEGRATION_EXAMPLES.md** (Code Examples)
Ready-to-use code snippets for:
- ASP.NET Core / Blazor (OIDC)
- React SPA (OAuth PKCE)
- Node.js/Express (JWT)
- Angular (OAuth PKCE)
- Vue.js (OAuth PKCE)
- Common patterns (token refresh, interceptors)

**When to use**: Copy-paste code examples for quick integration.

## 🚀 Quick Start

### For First-Time Users

1. **Understand the System** (15 min)
   - Read: SKILL.md → Overview & Architecture sections
   - Understand: Multi-tenancy, OAuth/OIDC, RBAC concepts

2. **Choose Your Integration** (5 min)
   - Identify your framework (ASP.NET, React, Node.js, etc.)
   - Review: INTEGRATION_EXAMPLES.md for your framework

3. **Implement Authentication** (30-60 min)
   - Follow: Step-by-step code examples
   - Configure: Client ID, secrets, redirect URIs
   - Test: Login, logout, protected routes

4. **Test SSO** (15 min)
   - Test: Single sign-on across multiple apps
   - Test: Single sign-out functionality
   - Verify: Cookies and tokens

**Total Time**: ~1.5 hours to working authentication!

## 🎯 Common Use Cases

### Use Case 1: Add SSO to Existing App
**Goal**: Enable single sign-on authentication

**Steps**:
1. Register application in DoorAuth
2. Install OIDC/OAuth library
3. Configure authentication (see INTEGRATION_EXAMPLES.md)
4. Update login/logout flows
5. Protect routes with authorization

**Time**: 1-2 hours  
**Reference**: INTEGRATION_EXAMPLES.md → Your framework section

### Use Case 2: Build Multi-Tenant SaaS
**Goal**: Create tenant-isolated application

**Steps**:
1. Create tenant during signup
2. Filter all queries by tenantId
3. Implement tenant-specific branding
4. Create tenant admin role
5. Test tenant isolation

**Time**: 4-8 hours  
**Reference**: SKILL.md → Multi-Tenant Architecture

### Use Case 3: Implement RBAC
**Goal**: Role-based access control

**Steps**:
1. Define roles and permissions
2. Assign permissions to roles
3. Assign roles to users
4. Check permissions in controllers
5. Filter UI based on permissions

**Time**: 2-4 hours  
**Reference**: SKILL.md → Authorization & Access Control

### Use Case 4: Dynamic Menu System
**Goal**: Permission-filtered navigation

**Steps**:
1. Create menu structure in DoorAuth
2. Assign permissions to menu items
3. Fetch smart menu from API
4. Render menu dynamically
5. Handle hierarchical menus

**Time**: 2-3 hours  
**Reference**: API_REFERENCE.md → Menu Management

## 📖 Integration Patterns

### Pattern 1: Server-Side Web Apps (OIDC)
**Frameworks**: ASP.NET Core, Blazor Server, PHP, Ruby on Rails

**Flow**:
1. User clicks "Login"
2. App redirects to DoorAuth
3. User authenticates
4. DoorAuth redirects back with auth code
5. App exchanges code for tokens
6. App creates session cookie

**Security**: Server-side session, HttpOnly cookies, PKCE

**Example**: INTEGRATION_EXAMPLES.md → ASP.NET Core

### Pattern 2: Single-Page Apps (OAuth PKCE)
**Frameworks**: React, Angular, Vue.js

**Flow**:
1. User clicks "Login"
2. App redirects to DoorAuth (with PKCE challenge)
3. User authenticates
4. DoorAuth redirects back with auth code
5. App exchanges code for tokens (with PKCE verifier)
6. App stores tokens in memory/sessionStorage

**Security**: PKCE, short-lived tokens, token refresh

**Example**: INTEGRATION_EXAMPLES.md → React SPA

### Pattern 3: API/Backend Services (JWT)
**Frameworks**: Node.js, Python, Go, Java

**Flow**:
1. Client sends request with Bearer token
2. API validates JWT signature
3. API checks token expiration
4. API extracts user claims
5. API processes request

**Security**: JWT signature validation, public key verification

**Example**: INTEGRATION_EXAMPLES.md → Node.js/Express

## 🔒 Security Checklist

### Development
- [ ] Use HTTPS (self-signed certs OK)
- [ ] Enable PKCE for public clients
- [ ] Set secure cookie flags (SameSite=None, Secure=true)
- [ ] Validate tokens on every request
- [ ] Never log tokens or secrets

### Production
- [ ] Use valid SSL certificates
- [ ] Store secrets in environment variables
- [ ] Enable token signature validation
- [ ] Remove certificate bypass code
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Implement session timeout
- [ ] Add audit logging
- [ ] Monitor authentication metrics

## 🧪 Testing Guide

### Manual Testing
1. **Login Flow**
   - [ ] User can register
   - [ ] User can login
   - [ ] User info is displayed
   - [ ] Protected routes require auth

2. **SSO Flow**
   - [ ] Login to App A
   - [ ] Navigate to App B (auto-login)
   - [ ] User info matches across apps

3. **Logout Flow**
   - [ ] Logout from App A
   - [ ] Verify logged out from App B
   - [ ] Cannot access protected routes

4. **Token Flow**
   - [ ] Tokens are issued correctly
   - [ ] Tokens expire as expected
   - [ ] Refresh tokens work
   - [ ] Revoked tokens are rejected

### Automated Testing
```bash
# Server tests
cd server
npm test                 # All tests
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests

# Coverage
npm run test:coverage
```

## 🛠️ Troubleshooting

### Quick Fixes

| Issue | Solution | Reference |
|-------|----------|-----------|
| "Correlation failed" | Set `SameSite=None`, `Secure=true` | SKILL.md → Troubleshooting |
| Certificate errors | Add certificate bypass (dev only) | INTEGRATION_EXAMPLES.md |
| "invalid_grant" | Check ClientSecret, code expiry | API_REFERENCE.md → Token Exchange |
| User not authenticated | Check middleware order | INTEGRATION_EXAMPLES.md |
| SSO not working | Check cookie settings | SKILL.md → Cookie Security |

### Debug Steps
1. Enable debug logging
2. Check browser console
3. Inspect cookies in DevTools
4. Verify OIDC discovery endpoint
5. Compare with working example

## 📊 System Overview

### Components
```
┌─────────────────────────────────────────────┐
│           DoorAuth Server                    │
│  (Authentication & Authorization Provider)   │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐  ┌──────────────┐         │
│  │   Backend   │  │   Frontend   │         │
│  │  (Node.js)  │  │   (React)    │         │
│  └─────────────┘  └──────────────┘         │
│                                             │
│  ┌─────────────────────────────────┐       │
│  │      Database (SQLite/PG)       │       │
│  │  - Users    - Roles             │       │
│  │  - Tenants  - Permissions       │       │
│  │  - Apps     - Sessions          │       │
│  └─────────────────────────────────┘       │
└─────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼───┐   ┌───▼────┐   ┌──▼─────┐
   │ App A  │   │ App B  │   │ App C  │
   │ (OIDC) │   │ (OIDC) │   │ (JWT)  │
   └────────┘   └────────┘   └────────┘
```

### Key Features
- ✅ Multi-Tenant Architecture
- ✅ OAuth 2.0 / OIDC Provider
- ✅ Single Sign-On (SSO)
- ✅ Single Sign-Out
- ✅ Role-Based Access Control (RBAC)
- ✅ Dynamic Menu Management
- ✅ Session Management
- ✅ Two-Factor Authentication (2FA)
- ✅ Email Verification
- ✅ Password Recovery
- ✅ Token Blacklisting
- ✅ Audit Logging

### Technology Stack
**Backend**: Node.js, Express, TypeScript, Prisma, JWT  
**Frontend**: React, Vite, TailwindCSS, Axios  
**Database**: SQLite (dev), PostgreSQL (prod)  
**Auth**: OAuth 2.0, OIDC, PKCE, TOTP

## 📞 Support

### Documentation
- **Main Guide**: SKILL.md
- **API Reference**: API_REFERENCE.md
- **Code Examples**: INTEGRATION_EXAMPLES.md
- **Swagger UI**: https://localhost:3000/api-docs

### Example Applications
- **DoorAuthSample**: ASP.NET Core Razor Pages
- **client_todo**: React SPA
- **client**: React Admin Panel

### External Resources
- [OAuth 2.0 Spec](https://oauth.net/2/)
- [OIDC Spec](https://openid.net/connect/)
- [PKCE RFC](https://tools.ietf.org/html/rfc7636)
- [JWT RFC](https://tools.ietf.org/html/rfc7519)

## 🎓 Learning Path

### Beginner (1 hour)
1. Read: SKILL.md → Overview
2. Review: INTEGRATION_EXAMPLES.md → Your framework
3. Implement: Basic login/logout
4. Test: Authentication works

### Intermediate (2 hours)
1. Complete: Beginner path
2. Understand: OAuth/OIDC flows
3. Implement: SSO across apps
4. Test: SSO login and logout

### Advanced (4 hours)
1. Complete: Intermediate path
2. Implement: RBAC and permissions
3. Add: Dynamic menus
4. Configure: Production settings
5. Test: All scenarios

## 📝 Quick Reference

### Default Credentials
```
Email: bd@gmail.com
Password: 1q2w3E*
Tenant: Default
```

### Server URLs
```
API: https://localhost:3000/api
Admin: https://localhost:3000
Swagger: https://localhost:3000/api-docs
OIDC Discovery: https://localhost:3000/.well-known/openid-configuration
```

### Common Commands
```bash
# Start server
cd server && npm run dev

# Start client
cd client && npm run dev

# Run tests
npm test

# Generate certs
npm run generate-certs

# Database
npx prisma studio
npx prisma migrate dev
npx prisma db seed
```

---

**Built with ❤️ for developers who need production-ready authentication**

For detailed information, see:
- **SKILL.md** - Complete reference
- **API_REFERENCE.md** - API documentation
- **INTEGRATION_EXAMPLES.md** - Code examples
