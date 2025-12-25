# DoorAuth Integration Guide for AI Agents

This guide is designed for AI agents to easily integrate new applications with the DoorAuth system using bulk operations and OIDC standards.

## Prerequisites

- DoorAuth server running on `http://localhost:3000`
- Admin access token for API calls
- Client application (e.g., .NET, React, Vue, Angular)

## Step 1: Register Application

**Context**: Register a new client application with DoorAuth.

**Method A: Using Script (Recommended)**
```bash
cd server
npx ts-node scripts/register-your-app.ts
```

**Method B: Direct API Call**
```bash
POST /api/applications
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Your App Name",
  "clientId": "your-app-client-id",
  "clientSecret": "your-secure-secret",
  "redirectUris": "http://localhost:PORT/callback",
  "tenantId": "tenant-uuid",
  "description": "Your application description"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "app-uuid",
    "clientId": "your-app-client-id",
    "name": "Your App Name"
  }
}
```

## Step 2: Define Permissions

**Context**: Add application-specific permissions to the system.

**File**: `server/src/config/permissions.ts`

**Action**: Append to `SYSTEM_PERMISSIONS` array:
```typescript
{ resource: 'myapp', action: 'read', description: 'Read myapp data' },
{ resource: 'myapp', action: 'write', description: 'Write myapp data' },
{ resource: 'myapp', action: 'delete', description: 'Delete myapp data' }
```

**Important**: Restart the server after modifying permissions:
```bash
# Server will auto-restart if using nodemon
# Otherwise: npm run dev
```

## Step 3: Bulk Create Roles

**Context**: Create multiple roles for the application at once.

**Endpoint**: `POST /api/roles/bulk`

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:
```json
{
  "tenantId": "tenant-uuid",
  "roles": [
    {
      "name": "App Admin",
      "description": "Full access to the application",
      "applicationId": "app-uuid",
      "permissionIds": ["myapp:read", "myapp:write", "myapp:delete"]
    },
    {
      "name": "App User",
      "description": "Standard user access",
      "applicationId": "app-uuid",
      "permissionIds": ["myapp:read"]
    },
    {
      "name": "App Viewer",
      "description": "Read-only access",
      "applicationId": "app-uuid",
      "permissionIds": ["myapp:read"]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "role-uuid-1",
      "name": "App Admin",
      "permissions": [...]
    },
    ...
  ]
}
```

## Step 4: Bulk Create Menus

**Context**: Define the navigation menu structure for your application.

**Endpoint**: `POST /api/menus/bulk`

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:
```json
{
  "applicationId": "app-uuid",
  "menus": [
    {
      "label": "Dashboard",
      "path": "/dashboard",
      "icon": "layout-dashboard",
      "order": 1,
      "requiredPermission": "myapp:read"
    },
    {
      "label": "Users",
      "path": "/users",
      "icon": "users",
      "order": 2,
      "requiredPermission": "myapp:write"
    },
    {
      "label": "Settings",
      "path": "/settings",
      "icon": "settings",
      "order": 99,
      "requiredPermission": "myapp:write"
    }
  ]
}
```

**Note**: For nested menus, include `parentId` field referencing the parent menu's ID.

## Step 5: Bulk Create Users

**Context**: Provision initial user accounts.

**Endpoint**: `POST /api/users/bulk`

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:
```json
{
  "tenantId": "tenant-uuid",
  "users": [
    {
      "email": "admin@myapp.com",
      "userName": "App Administrator",
      "password": "SecurePassword123!",
      "designation": "Administrator",
      "isApproved": true
    },
    {
      "email": "user@myapp.com",
      "userName": "Standard User",
      "password": "SecurePassword123!",
      "designation": "Staff",
      "isApproved": true
    }
  ]
}
```

**Security Note**: Change passwords after first login in production.

## Step 6: Assign Roles to Users

**Context**: Link users to their respective roles.

**Endpoint**: `POST /api/users/{userId}/roles`

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body**:
```json
{
  "roleId": "role-uuid-from-step-3"
}
```

**Repeat** for each user-role assignment.

## Step 7: OIDC Discovery

**Context**: Verify OpenID Connect configuration is accessible.

**Endpoint**: `GET /.well-known/openid-configuration`

**No Authentication Required**

**Test**:
```bash
curl http://localhost:3000/.well-known/openid-configuration | jq
```

**Response**:
```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/api/oauth/authorize",
  "token_endpoint": "http://localhost:3000/api/oauth/token",
  "userinfo_endpoint": "http://localhost:3000/api/oauth/userinfo",
  "jwks_uri": "http://localhost:3000/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "code_challenge_methods_supported": ["S256", "plain"]
}
```

## Step 8: Verify JWKS

**Context**: Ensure public signing keys are available for token verification.

**Endpoint**: `GET /.well-known/jwks.json`

**No Authentication Required**

**Test**:
```bash
curl http://localhost:3000/.well-known/jwks.json | jq
```

**Response**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "unique-key-id",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

## Step 9: Client Configuration

### Option A: .NET Core / ASP.NET Core

**Install Package**:
```bash
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
```

**Configure in Program.cs**:
```csharp
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    // DoorAuth auto-discovers endpoints
    options.Authority = "http://localhost:3000";
    
    // Your app credentials from Step 1
    options.ClientId = "your-app-client-id";
    options.ClientSecret = "your-secure-secret";
    
    // OAuth settings
    options.ResponseType = "code";
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Development only
    options.RequireHttpsMetadata = false;
    
    // Scopes
    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    
    // Token validation
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role",
        ValidateIssuerSigningKey = true
    };
});

app.UseAuthentication();
app.UseAuthorization();
```

### Option B: JavaScript / React / Vue / Angular

**Install Package**:
```bash
npm install oidc-client-ts
```

**Configure Auth Service**:
```typescript
import { UserManager } from 'oidc-client-ts';

export const authConfig = {
    authority: 'http://localhost:3000',
    client_id: 'your-app-client-id',
    client_secret: 'your-secure-secret', // Only for confidential clients
    redirect_uri: 'http://localhost:PORT/callback',
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: 'http://localhost:PORT',
    
    // PKCE for enhanced security
    code_challenge_method: 'S256'
};

const userManager = new UserManager(authConfig);

// Login
export const login = () => userManager.signinRedirect();

// Handle callback
export const handleCallback = () => userManager.signinRedirectCallback();

// Logout
export const logout = () => userManager.signoutRedirect();

// Get user
export const getUser = () => userManager.getUser();
```

## Step 10: Token Exchange

**Context**: Exchange authorization code for access tokens.

**Endpoint**: `POST /api/oauth/token`

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
# OR
Content-Type: application/json
```

**Body (Form-Encoded - Standard)**:
```
grant_type=authorization_code
&code=authorization_code_from_callback
&client_id=your-app-client-id
&client_secret=your-secure-secret
&redirect_uri=http://localhost:PORT/callback
```

**Body (JSON - Alternative)**:
```json
{
  "grant_type": "authorization_code",
  "code": "authorization_code_from_callback",
  "client_id": "your-app-client-id",
  "client_secret": "your-secure-secret",
  "redirect_uri": "http://localhost:PORT/callback"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "a1b2c3d4e5f6...",
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "openid profile email"
}
```

## Step 11: Fetch Dynamic Menus

**Context**: Retrieve permission-filtered menus for the authenticated user.

**Endpoint**: `GET /api/menus/smart?applicationId={app-uuid}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "menu-uuid",
      "label": "Dashboard",
      "path": "/dashboard",
      "icon": "layout-dashboard",
      "order": 1,
      "children": []
    },
    ...
  ]
}
```

**Note**: Only returns menus the user has permission to access.

## Error Handling

All OAuth/OIDC endpoints return standard error responses:

### Invalid Request
```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameters"
}
```

### Invalid Grant
```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code expired"
}
```

### Unsupported Grant Type
```json
{
  "error": "unsupported_grant_type",
  "error_description": "Supported grant types: authorization_code, refresh_token"
}
```

### Invalid Client
```json
{
  "error": "invalid_client",
  "error_description": "Invalid client credentials"
}
```

## Logging and Monitoring

All OIDC operations are logged with `[OIDC]` prefix:

```
[INFO] [OIDC] Discovery endpoint accessed
[INFO] [OIDC] Authorization request received { client_id, has_pkce: true }
[INFO] [OIDC] User authenticated - generating authorization code
[INFO] [OIDC] Token request received { grant_type, content_type }
[INFO] [OIDC] Tokens generated successfully { has_id_token: true }
```

**Filter logs**:
```bash
npm run dev | grep "\[OIDC\]"
```

## Quick Reference

### Discovery & Keys
- **Discovery**: `GET /.well-known/openid-configuration`
- **JWKS**: `GET /.well-known/jwks.json`

### OAuth Endpoints
- **Authorize**: `GET /api/oauth/authorize`
- **Token**: `POST /api/oauth/token`
- **UserInfo**: `GET /api/oauth/userinfo`
- **Revoke**: `POST /api/oauth/revoke`

### Management Endpoints
- **Bulk Roles**: `POST /api/roles/bulk`
- **Bulk Menus**: `POST /api/menus/bulk`
- **Bulk Users**: `POST /api/users/bulk`
- **Assign Role**: `POST /api/users/{userId}/roles`
- **Smart Menus**: `GET /api/menus/smart?applicationId={id}`

### Supported Features
- ✅ Authorization Code Flow
- ✅ PKCE (S256, plain)
- ✅ Refresh Tokens
- ✅ ID Tokens (RS256, HS256)
- ✅ JWKS for token verification
- ✅ Form-encoded & JSON requests
- ✅ Dynamic menu filtering
- ✅ Comprehensive logging

## Security Best Practices

1. **Use HTTPS in Production**: Set `RequireHttpsMetadata = true`
2. **Enable PKCE**: Always use `code_challenge_method: 'S256'`
3. **Rotate Keys**: Quarterly rotation for production
4. **Strong Secrets**: Use cryptographically secure client secrets
5. **Validate Tokens**: Always verify issuer, audience, and signature
6. **Minimal Scopes**: Request only necessary scopes
7. **Secure Storage**: Never expose client secrets in frontend code

## Troubleshooting

### Discovery fails
- Verify server is running: `curl http://localhost:3000/health`
- Check firewall settings

### Token exchange fails
- Check logs for `[OIDC] Token request received`
- Verify `content_type` and `body_keys` in logs
- Ensure both JSON and form-encoded parsers are enabled

### Missing parameters
- Check `body_keys` in logs to see what was parsed
- Verify Content-Type header matches body format

### Token verification fails
- Ensure JWKS endpoint is accessible
- Verify token signature with public key
- Check token expiration

## Production Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS
- [ ] Rotate signing keys
- [ ] Backup private keys securely
- [ ] Set up log aggregation
- [ ] Configure rate limiting
- [ ] Enable monitoring/alerts
- [ ] Document client credentials
- [ ] Test key rotation procedure
- [ ] Review security settings

## Additional Resources

- [OIDC Integration Guide](docs/OIDC_INTEGRATION_GUIDE.md)
- [JWKS Implementation](JWKS_IMPLEMENTATION.md)
- [OIDC Logging](OIDC_LOGGING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
