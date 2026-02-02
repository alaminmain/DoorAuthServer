---
name: auth-patterns
description: This skill should be used when the user asks to "add authentication", "protect an endpoint", "implement OAuth", "set up OIDC", "handle JWT tokens", "implement RBAC", "add permissions", "secure API routes", "implement 2FA", "add role-based access", or needs guidance on authentication flows, token management, or authorization patterns.
version: 1.0.0
---

# Authentication & Authorization Patterns

> Secure authentication flows, token management, and role-based access control.

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Authentication** | Verify identity (who you are) |
| **Authorization** | Verify permissions (what you can do) |
| **OAuth 2.0** | Delegated authorization framework |
| **OIDC** | Identity layer on top of OAuth 2.0 |
| **JWT** | Stateless token format for claims |
| **RBAC** | Role-Based Access Control |

---

## Authentication Patterns

### JWT Authentication Flow

```
1. User submits credentials
2. Server validates credentials
3. Server generates JWT (access + refresh tokens)
4. Store tokens in HttpOnly cookies (preferred) or secure storage
5. Client sends token with each request
6. Server validates token and extracts claims
```

### Token Storage Strategy

| Location | Security | Use Case |
|----------|----------|----------|
| **HttpOnly Cookie** | High | Web apps (CSRF protection needed) |
| **Memory** | High | SPAs (lost on refresh) |
| **localStorage** | Low | Avoid (XSS vulnerable) |
| **Secure Cookie + Memory** | Highest | Hybrid approach |

### Token Refresh Pattern

```
Access Token: Short-lived (15-30 min)
Refresh Token: Long-lived (7-30 days)

1. Access token expires
2. Client sends refresh token
3. Server validates refresh token
4. Server issues new access token
5. Optionally rotate refresh token
```

---

## Authorization Patterns

### RBAC Implementation

```
User → UserRole → Role → RolePermission → Permission
```

| Component | Responsibility |
|-----------|----------------|
| **Permission** | Granular action (e.g., `users.create`) |
| **Role** | Collection of permissions |
| **UserRole** | Assignment of roles to users |

### Permission Middleware Pattern

```typescript
// Middleware chain
authenticate → extractTenant → checkPermission → handler
```

### Permission Naming Convention

```
resource.action

Examples:
- users.create
- users.read
- users.update
- users.delete
- roles.assign
- applications.manage
```

---

## OAuth 2.0 / OIDC Flows

### Authorization Code + PKCE (Recommended)

```
1. Generate code_verifier (random string)
2. Create code_challenge = SHA256(code_verifier)
3. Redirect to /authorize with code_challenge
4. User authenticates
5. Receive authorization code
6. Exchange code + code_verifier for tokens
```

### OIDC Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/.well-known/openid-configuration` | Discovery document |
| `/.well-known/jwks.json` | Public keys for verification |
| `/authorize` | Start auth flow |
| `/token` | Exchange code for tokens |
| `/userinfo` | Get user claims |
| `/revoke` | Revoke tokens |
| `/end_session` | Logout |

---

## Security Best Practices

### Token Security

- Store in HttpOnly cookies with Secure flag
- Implement token blacklist for logout
- Use short expiration for access tokens
- Rotate refresh tokens on use
- Validate token signature and claims

### Password Security

- Hash with bcrypt (cost factor 12+)
- Enforce complexity requirements
- Implement rate limiting on login
- Add account lockout after failures

### 2FA Implementation

```
1. User enables 2FA
2. Generate TOTP secret
3. Store encrypted secret
4. User scans QR code
5. Verify initial code
6. On login: verify password + TOTP
```

---

## Multi-Tenancy Considerations

### Tenant Isolation

```typescript
// Always scope queries by tenantId
const users = await prisma.user.findMany({
  where: { tenantId: currentTenant.id }
});
```

### Tenant-Aware Auth

```
1. Extract tenant from subdomain/header/token
2. Validate user belongs to tenant
3. Scope all queries to tenant
4. Include tenantId in JWT claims
```

---

## Additional Resources

### Reference Files

For detailed implementation patterns, consult:
- **`references/jwt-implementation.md`** - JWT generation, validation, refresh flows
- **`references/oauth-oidc-flows.md`** - Complete OAuth/OIDC implementation guide
- **`references/rbac-patterns.md`** - RBAC schema design and permission checking

### Example Files

Working examples in `examples/`:
- **`auth-middleware.ts`** - Express authentication middleware
- **`permission-middleware.ts`** - RBAC permission checking
- **`oauth-client.ts`** - OAuth client implementation

---

## Quick Decision Guide

| Need | Solution |
|------|----------|
| Simple API auth | JWT in HttpOnly cookies |
| Third-party login | OAuth 2.0 Authorization Code + PKCE |
| Microservices | JWT with shared secret or JWKS |
| Role-based access | RBAC with permission middleware |
| Extra security | Add 2FA (TOTP) |
| Multi-tenant | Tenant-scoped tokens and queries |

---

## Validation Checklist

Before completing auth implementation:

- [ ] Tokens stored securely (HttpOnly cookies)
- [ ] Password hashing with bcrypt
- [ ] Rate limiting on auth endpoints
- [ ] Token expiration configured
- [ ] Refresh token rotation enabled
- [ ] CSRF protection for cookies
- [ ] Permission checks on protected routes
- [ ] Tenant isolation verified
- [ ] Logout invalidates tokens
