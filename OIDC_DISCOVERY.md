# OpenID Connect Discovery Support

## Overview
DoorAuth now supports OpenID Connect Discovery, which allows .NET applications and other OIDC-compliant clients to automatically discover authentication endpoints.

## Endpoints

### Discovery Document
**URL**: `http://localhost:3000/.well-known/openid-configuration`

Returns metadata about the OAuth/OIDC provider including:
- Authorization endpoint
- Token endpoint
- UserInfo endpoint
- Supported scopes, response types, and grant types

### JWKS (JSON Web Key Set)
**URL**: `http://localhost:3000/.well-known/jwks.json`

Returns public keys for token verification (currently empty, to be implemented with actual key generation).

## .NET Integration

For .NET applications using Microsoft.AspNetCore.Authentication.OpenIdConnect:

```csharp
services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    options.Authority = "http://localhost:3000";
    options.ClientId = "your-client-id";
    options.ClientSecret = "your-client-secret";
    options.ResponseType = "code";
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // For development only - disable HTTPS requirement
    options.RequireHttpsMetadata = false;
    
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
});
```

## Supported Features

- ✅ Authorization Code Flow
- ✅ PKCE (Proof Key for Code Exchange)
- ✅ Refresh Tokens
- ✅ Client Credentials Grant
- ⚠️ JWKS (Placeholder - needs implementation)
- ⚠️ ID Tokens (Basic support)

## Troubleshooting

### Error: Unable to retrieve document from .well-known/openid-configuration

**Cause**: The discovery endpoint was not implemented.

**Solution**: This has been fixed by adding the `well-known.routes.ts` file and registering it in `index.ts`.

### Error: IDX20803 or IDX20807

**Cause**: Network issues or the server is not running.

**Solution**: 
1. Ensure the DoorAuth server is running on port 3000
2. Test the endpoint: `curl http://localhost:3000/.well-known/openid-configuration`
3. Check firewall settings if running on different machines

### Error: OpenIdConnectProtocolException - Message contains error

**Cause**: The token endpoint was returning non-standard error responses.

**Solution**: Fixed by updating the OAuth controller to return standard OAuth 2.0 error responses:
- `invalid_request` - Missing required parameters
- `invalid_grant` - Token exchange failed
- `unsupported_grant_type` - Unsupported grant type

The token endpoint now returns:
```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "id_token": "...",
  "scope": "openid profile email"
}
```

### Error: AuthenticationFailureException

**Cause**: Missing `id_token` in the token response.

**Solution**: The service now generates and returns an `id_token` with standard OIDC claims:
- `sub` - Subject (user ID)
- `email` - User email
- `email_verified` - Email verification status
- `name` - User's full name
- `preferred_username` - Login ID
- `aud` - Audience (client ID)
- `iss` - Issuer URL

### Error: Token request parameters not received

**Cause**: .NET OIDC middleware sends token requests as `application/x-www-form-urlencoded`, but server only parsed JSON.

**Solution**: Added `express.urlencoded({ extended: true })` middleware to parse form-encoded requests. The server now supports both:
- `application/json` - For JavaScript clients
- `application/x-www-form-urlencoded` - For .NET and other OIDC clients (standard)

Check logs for `content_type` and `body_keys` to verify parsing is working.
