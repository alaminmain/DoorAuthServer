# OpenID Connect (OIDC) Integration Guide

## Overview

DoorAuth is a fully compliant OpenID Connect (OIDC) provider that supports integration with .NET applications, JavaScript SPAs, and any OIDC-compliant client.

## Discovery Endpoint

DoorAuth implements the OIDC Discovery specification, allowing clients to automatically discover endpoints and capabilities.

**Discovery URL**: `http://localhost:3000/.well-known/openid-configuration`

### Discovery Response

```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/api/oauth/authorize",
  "token_endpoint": "http://localhost:3000/api/oauth/token",
  "userinfo_endpoint": "http://localhost:3000/api/oauth/userinfo",
  "revocation_endpoint": "http://localhost:3000/api/oauth/revoke",
  "jwks_uri": "http://localhost:3000/.well-known/jwks.json",
  "response_types_supported": ["code", "token", "id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["HS256", "RS256"],
  "scopes_supported": ["openid", "profile", "email", "offline_access"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "code_challenge_methods_supported": ["S256", "plain"],
  "grant_types_supported": ["authorization_code", "refresh_token", "client_credentials"]
}
```

## Supported Features

### ✅ Implemented
- **Authorization Code Flow** - Standard OAuth 2.0 flow
- **PKCE (Proof Key for Code Exchange)** - Enhanced security for public clients
- **Refresh Tokens** - Long-lived access without re-authentication
- **ID Tokens** - OpenID Connect identity tokens with standard claims
- **UserInfo Endpoint** - Retrieve user profile information
- **Discovery Document** - Automatic endpoint discovery
- **Token Revocation** - Invalidate tokens

### ⚠️ Partial Support
- **JWKS Endpoint** - Placeholder (returns empty keys array)
- **Implicit Flow** - Not recommended, use Authorization Code + PKCE instead

## Integration Examples

### .NET Core / ASP.NET Core

#### 1. Install NuGet Package
```bash
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
```

#### 2. Configure in `Program.cs` or `Startup.cs`

```csharp
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    // DoorAuth server URL
    options.Authority = "http://localhost:3000";
    
    // Your application credentials (from DoorAuth admin panel)
    options.ClientId = "your-app-client-id";
    options.ClientSecret = "your-app-client-secret";
    
    // OAuth flow configuration
    options.ResponseType = "code";
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Development only - disable HTTPS requirement
    options.RequireHttpsMetadata = false;
    
    // Requested scopes
    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    
    // Map claims to .NET identity
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role"
    };
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "Hello World!");
app.MapGet("/secure", () => "Secure endpoint")
    .RequireAuthorization();

app.Run();
```

#### 3. Protect Controllers/Endpoints

```csharp
[Authorize]
public class SecureController : Controller
{
    public IActionResult Index()
    {
        var userName = User.Identity?.Name;
        var email = User.FindFirst("email")?.Value;
        return View();
    }
}
```

### JavaScript / React / Vue / Angular

#### 1. Install OIDC Client Library

```bash
npm install oidc-client-ts
```

#### 2. Configure OIDC Client

```typescript
import { UserManager } from 'oidc-client-ts';

const config = {
  authority: 'http://localhost:3000',
  client_id: 'your-app-client-id',
  client_secret: 'your-app-client-secret', // Only for confidential clients
  redirect_uri: 'http://localhost:5173/callback',
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: 'http://localhost:5173',
  
  // PKCE for enhanced security
  code_challenge_method: 'S256'
};

const userManager = new UserManager(config);

// Login
export const login = () => userManager.signinRedirect();

// Handle callback
export const handleCallback = () => userManager.signinRedirectCallback();

// Logout
export const logout = () => userManager.signoutRedirect();

// Get user
export const getUser = () => userManager.getUser();
```

## Token Response Format

### Successful Token Exchange

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

### ID Token Claims

```json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "preferred_username": "john.doe@example.com",
  "aud": "your-app-client-id",
  "iss": "http://localhost:3000",
  "iat": 1703520000,
  "exp": 1703523600
}
```

### Access Token Claims

```json
{
  "userId": "user-id-uuid",
  "tenantId": "tenant-id-uuid",
  "email": "user@example.com",
  "roles": ["Admin", "User"],
  "permissions": ["users:read", "users:write"],
  "type": "access_token",
  "iat": 1703520000,
  "exp": 1703523600
}
```

## Error Responses

All OAuth/OIDC endpoints return standard error responses:

### Invalid Request
```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameters: code, redirect_uri"
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

## Troubleshooting

### Error: IDX20803 / IDX20807 - Unable to retrieve configuration

**Cause**: Discovery endpoint not accessible

**Solution**:
1. Verify server is running: `curl http://localhost:3000/.well-known/openid-configuration`
2. Check firewall settings
3. Ensure correct authority URL in client configuration

### Error: OpenIdConnectProtocolException - Message contains error

**Cause**: Non-standard error response format

**Solution**: This has been fixed. The token endpoint now returns OAuth 2.0 standard error responses.

### Error: Missing id_token in response

**Cause**: ID token not generated

**Solution**: This has been fixed. The service now generates and returns `id_token` with all standard OIDC claims.

### Error: Invalid signature

**Cause**: JWT secret mismatch or token tampering

**Solution**:
1. Ensure `JWT_SECRET` is consistent in `.env`
2. Don't modify tokens manually
3. Check token hasn't expired

## Security Best Practices

### 1. Use HTTPS in Production
```csharp
options.RequireHttpsMetadata = true; // Enable in production
```

### 2. Enable PKCE
```typescript
code_challenge_method: 'S256' // Always use S256, not 'plain'
```

### 3. Validate Tokens
- Always validate `iss` (issuer)
- Check `aud` (audience) matches your client ID
- Verify `exp` (expiration) hasn't passed
- Validate signature

### 4. Secure Client Secrets
- Never expose client secrets in frontend code
- Use environment variables
- Rotate secrets regularly

### 5. Use Appropriate Scopes
- Request only necessary scopes
- `openid` - Required for OIDC
- `profile` - User profile information
- `email` - Email address
- `offline_access` - Refresh tokens

## Testing

### Test Discovery Endpoint
```bash
curl http://localhost:3000/.well-known/openid-configuration | jq
```

### Test Authorization Flow
1. Navigate to: `http://localhost:3000/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=openid%20profile%20email`
2. Login with credentials
3. Receive authorization code in redirect
4. Exchange code for tokens

### Test Token Endpoint
```bash
curl -X POST http://localhost:3000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "YOUR_AUTH_CODE",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uri": "YOUR_REDIRECT_URI"
  }'
```

## Production Considerations

### 1. Environment Variables
```env
# Production .env
ISSUER_URL=https://auth.yourdomain.com
JWT_SECRET=<strong-random-secret>
DATABASE_URL=<production-database-url>
NODE_ENV=production
```

### 2. HTTPS Configuration
- Use reverse proxy (nginx, Apache)
- Enable SSL/TLS certificates
- Force HTTPS redirects

### 3. Database
- Use PostgreSQL or MySQL instead of SQLite
- Enable connection pooling
- Regular backups

### 4. Monitoring
- Log all authentication attempts
- Monitor failed login attempts
- Track token usage

## Additional Resources

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
