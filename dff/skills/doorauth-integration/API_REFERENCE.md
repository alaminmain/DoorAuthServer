# DoorAuth API Reference

## Base URL
```
https://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication via Bearer token or HttpOnly cookie.

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "loginId": "user123",
  "userName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "tenantId": "tenant-uuid",
  "companyName": "Acme Corp",
  "designation": "Developer"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "userId": "user-uuid"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "loginId": "user123",
  "password": "SecurePass123!",
  "tenantId": "tenant-uuid"
}

Response: 200 OK
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "loginId": "user123",
    "email": "john@example.com",
    "tenantId": "tenant-uuid"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

---

## OAuth/OIDC Endpoints

### Authorization Endpoint
```http
GET /api/oauth/authorize?
  client_id=your-client-id&
  redirect_uri=https://yourapp.com/callback&
  response_type=code&
  scope=openid profile email&
  code_challenge=<challenge>&
  code_challenge_method=S256&
  state=<random-state>

Response: 302 Redirect
Location: https://yourapp.com/callback?code=<auth-code>&state=<state>
```

### Token Exchange
```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=<auth-code>&
redirect_uri=https://yourapp.com/callback&
client_id=your-client-id&
client_secret=your-secret&
code_verifier=<verifier>

Response: 200 OK
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "eyJhbGc...",
  "id_token": "eyJhbGc...",
  "scope": "openid profile email"
}
```

### UserInfo Endpoint
```http
GET /api/oauth/userinfo
Authorization: Bearer <access_token>

Response: 200 OK
{
  "sub": "user-uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "email_verified": true,
  "tenantId": "tenant-uuid"
}
```

### Revoke Token
```http
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

token=<refresh_token>&
token_type_hint=refresh_token&
client_id=your-client-id&
client_secret=your-secret

Response: 200 OK
{
  "message": "Token revoked successfully"
}
```

### End Session (Logout)
```http
GET /api/oauth/end_session?
  id_token_hint=<id_token>&
  post_logout_redirect_uri=https://yourapp.com/

Response: 302 Redirect
Location: https://yourapp.com/
```

---

## Session Management

### List User Sessions
```http
GET /api/sessions
Authorization: Bearer <token>

Response: 200 OK
{
  "sessions": [
    {
      "id": "session-uuid",
      "deviceInfo": "Chrome on Windows",
      "browser": "Chrome",
      "os": "Windows 10",
      "ipAddress": "192.168.1.1",
      "loginTime": "2026-01-17T01:30:00Z",
      "lastActivity": "2026-01-17T07:30:00Z",
      "isActive": true
    }
  ]
}
```

### Get Active Sessions
```http
GET /api/sessions/active
Authorization: Bearer <token>

Response: 200 OK
{
  "activeSessions": 3,
  "sessions": [...]
}
```

### Revoke Session
```http
DELETE /api/sessions/:sessionId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Session revoked successfully"
}
```

### Revoke All Sessions
```http
DELETE /api/sessions/all
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "All sessions revoked",
  "count": 5
}
```

---

## Tenant Management

### List Tenants
```http
GET /api/tenants
Authorization: Bearer <token>

Response: 200 OK
{
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "Acme Corp",
      "domain": "acme.com",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Create Tenant
```http
POST /api/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Corp",
  "domain": "newcorp.com",
  "brandingConfig": "{\"logo\": \"url\", \"primaryColor\": \"#007bff\"}"
}

Response: 201 Created
{
  "message": "Tenant created successfully",
  "tenant": {
    "id": "new-tenant-uuid",
    "name": "New Corp",
    "domain": "newcorp.com"
  }
}
```

### Update Tenant
```http
PUT /api/tenants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Corp",
  "brandingConfig": "{...}"
}

Response: 200 OK
{
  "message": "Tenant updated successfully"
}
```

### Delete Tenant
```http
DELETE /api/tenants/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Tenant deleted successfully"
}
```

---

## Application Management

### List Applications
```http
GET /api/applications?tenantId=<tenant-uuid>
Authorization: Bearer <token>

Response: 200 OK
{
  "applications": [
    {
      "id": "app-uuid",
      "name": "Vehicle Management",
      "clientId": "vehicle-mgmt-web",
      "redirectUris": "https://localhost:7231/signin-oidc",
      "status": "active"
    }
  ]
}
```

### Create Application
```http
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My App",
  "description": "Application description",
  "tenantId": "tenant-uuid",
  "redirectUris": "https://myapp.com/callback,https://myapp.com/silent-callback",
  "appUrl": "https://myapp.com",
  "logoUrl": "https://myapp.com/logo.png"
}

Response: 201 Created
{
  "message": "Application created successfully",
  "application": {
    "id": "app-uuid",
    "clientId": "generated-client-id",
    "clientSecret": "generated-secret"
  }
}
```

### Regenerate Client Secret
```http
POST /api/applications/:id/regenerate-secret
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Client secret regenerated",
  "clientSecret": "new-secret"
}
```

---

## Role Management

### List Roles
```http
GET /api/roles?tenantId=<tenant-uuid>
Authorization: Bearer <token>

Response: 200 OK
{
  "roles": [
    {
      "id": "role-uuid",
      "name": "Admin",
      "description": "Administrator role",
      "isSystem": true,
      "permissions": [
        {
          "resource": "users",
          "action": "read"
        }
      ]
    }
  ]
}
```

### Create Role
```http
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Manager",
  "description": "Manager role",
  "tenantId": "tenant-uuid",
  "applicationId": "app-uuid"
}

Response: 201 Created
{
  "message": "Role created successfully",
  "role": {
    "id": "role-uuid",
    "name": "Manager"
  }
}
```

### Add Permission to Role
```http
POST /api/roles/:roleId/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "resource": "reports",
  "action": "read"
}

Response: 201 Created
{
  "message": "Permission added to role"
}
```

---

## User Management

### List Users
```http
GET /api/users?tenantId=<tenant-uuid>
Authorization: Bearer <token>

Response: 200 OK
{
  "users": [
    {
      "id": "user-uuid",
      "loginId": "john",
      "email": "john@example.com",
      "userName": "John Doe",
      "isApproved": true,
      "isLocked": false,
      "roles": ["Admin", "User"]
    }
  ]
}
```

### Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "loginId": "newuser",
  "userName": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "tenantId": "tenant-uuid",
  "designation": "Developer"
}

Response: 201 Created
{
  "message": "User created successfully",
  "userId": "user-uuid"
}
```

### Assign Role to User
```http
POST /api/users/:userId/roles/:roleId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Role assigned to user"
}
```

---

## Menu Management

### Get Smart Menu
```http
GET /api/menus/smart?applicationId=<app-uuid>
Authorization: Bearer <token>

Response: 200 OK
{
  "menus": [
    {
      "id": "menu-uuid",
      "label": "Dashboard",
      "path": "/dashboard",
      "icon": "home",
      "order": 1,
      "children": []
    },
    {
      "id": "menu-uuid-2",
      "label": "Users",
      "path": "/users",
      "icon": "users",
      "order": 2,
      "requiredPermission": "users:read",
      "children": [
        {
          "id": "submenu-uuid",
          "label": "User List",
          "path": "/users/list",
          "order": 1
        }
      ]
    }
  ]
}
```

### Create Menu Item
```http
POST /api/menus
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "Reports",
  "path": "/reports",
  "icon": "chart",
  "order": 3,
  "applicationId": "app-uuid",
  "parentId": null,
  "requiredPermission": "reports:read"
}

Response: 201 Created
{
  "message": "Menu created successfully",
  "menu": {
    "id": "menu-uuid",
    "label": "Reports"
  }
}
```

---

## Two-Factor Authentication

### Generate 2FA Secret
```http
POST /api/2fa/generate
Authorization: Bearer <token>

Response: 200 OK
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}
```

### Verify and Enable 2FA
```http
POST /api/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456",
  "secret": "JBSWY3DPEHPK3PXP"
}

Response: 200 OK
{
  "message": "2FA enabled successfully"
}
```

### Disable 2FA
```http
POST /api/2fa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "current-password"
}

Response: 200 OK
{
  "message": "2FA disabled successfully"
}
```

---

## Password Recovery

### Request Password Reset
```http
POST /api/password/forgot-password
Content-Type: application/json

{
  "email": "john@example.com",
  "tenantId": "tenant-uuid"
}

Response: 200 OK
{
  "message": "Password reset email sent"
}
```

### Reset Password
```http
POST /api/password/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "newPassword": "NewSecurePass123!"
}

Response: 200 OK
{
  "message": "Password reset successfully"
}
```

---

## Email Verification

### Send Verification Email
```http
POST /api/email/send-verification
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Verification email sent"
}
```

### Verify Email
```http
POST /api/email/verify
Content-Type: application/json

{
  "token": "verification-token"
}

Response: 200 OK
{
  "message": "Email verified successfully"
}
```

---

## Dashboard

### Get Statistics
```http
GET /api/dashboard/stats?tenantId=<tenant-uuid>
Authorization: Bearer <token>

Response: 200 OK
{
  "totalUsers": 150,
  "activeUsers": 120,
  "totalApplications": 5,
  "totalRoles": 8,
  "recentLogins": [
    {
      "userId": "user-uuid",
      "userName": "John Doe",
      "loginTime": "2026-01-17T07:30:00Z"
    }
  ]
}
```

---

## OIDC Discovery

### OpenID Configuration
```http
GET /.well-known/openid-configuration

Response: 200 OK
{
  "issuer": "https://localhost:3000",
  "authorization_endpoint": "https://localhost:3000/api/oauth/authorize",
  "token_endpoint": "https://localhost:3000/api/oauth/token",
  "userinfo_endpoint": "https://localhost:3000/api/oauth/userinfo",
  "end_session_endpoint": "https://localhost:3000/api/oauth/end_session",
  "jwks_uri": "https://localhost:3000/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_post"],
  "code_challenge_methods_supported": ["S256"]
}
```

### JWKS (Public Keys)
```http
GET /.well-known/jwks.json

Response: 200 OK
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "doorauth-key-2026",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "invalid_request",
  "message": "Missing required parameter: client_id"
}
```

### 401 Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "server_error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Default**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Pagination

List endpoints support pagination:
```http
GET /api/users?page=1&limit=20&sortBy=createdAt&order=desc
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```
