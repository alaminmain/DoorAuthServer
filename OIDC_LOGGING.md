# OIDC Handshake Logging

This document describes the comprehensive logging added to track the OpenID Connect (OIDC) authentication flow.

## Log Format

All OIDC logs are prefixed with `[OIDC]` for easy filtering and follow this pattern:
```
[INFO/WARN/ERROR] timestamp - [OIDC] Event description { context }
```

## Discovery Phase

### 1. Discovery Endpoint Access
**Endpoint**: `GET /.well-known/openid-configuration`

**Log**: `[OIDC] Discovery endpoint accessed`
```json
{
  "baseUrl": "http://localhost:3000",
  "clientIp": "::1",
  "userAgent": "Mozilla/5.0..."
}
```

### 2. JWKS Endpoint Access
**Endpoint**: `GET /.well-known/jwks.json`

**Log**: `[OIDC] JWKS endpoint accessed`
```json
{
  "clientIp": "::1"
}
```

## Authorization Phase

### 3. Authorization Request Received
**Endpoint**: `GET /api/oauth/authorize`

**Log**: `[OIDC] Authorization request received`
```json
{
  "client_id": "your-app-client",
  "redirect_uri": "http://localhost:5176/callback",
  "response_type": "code",
  "scope": "openid profile email",
  "has_pkce": true,
  "code_challenge_method": "S256",
  "clientIp": "::1"
}
```

### 4. Missing Parameters (Warning)
**Log**: `[OIDC] Authorization failed - missing parameters`
```json
{
  "client_id": "your-app-client",
  "has_response_type": false,
  "has_redirect_uri": true
}
```

### 5. Unsupported Response Type (Warning)
**Log**: `[OIDC] Authorization failed - unsupported response_type`
```json
{
  "client_id": "your-app-client",
  "response_type": "token"
}
```

### 6. User Not Authenticated
**Log**: `[OIDC] User not authenticated - redirecting to login`
```json
{
  "client_id": "your-app-client",
  "redirect_uri": "http://localhost:5176/callback"
}
```

### 7. User Authenticated
**Log**: `[OIDC] User authenticated - generating authorization code`
```json
{
  "client_id": "your-app-client",
  "userId": "uuid-here",
  "email": "user@example.com"
}
```

### 8. Authorization Code Generated
**Log**: `[OIDC] Authorization code generated successfully`
```json
{
  "client_id": "your-app-client",
  "userId": "uuid-here",
  "code_length": 64,
  "expires_in": 600
}
```

### 9. Redirecting to Client
**Log**: `[OIDC] Redirecting to client callback`
```json
{
  "client_id": "your-app-client",
  "redirect_uri": "http://localhost:5176/callback",
  "has_state": true
}
```

### 10. Authorization Error
**Log**: `[OIDC] Authorization error`
```json
{
  "error": "Invalid client_id",
  "stack": "Error: Invalid client_id\n    at ..."
}
```

## Token Exchange Phase

### 11. Token Request Received
**Endpoint**: `POST /api/oauth/token`

**Log**: `[OIDC] Token request received`
```json
{
  "grant_type": "authorization_code",
  "client_id": "your-app-client",
  "redirect_uri": "http://localhost:5176/callback",
  "has_code": true,
  "has_refresh_token": false,
  "has_code_verifier": true,
  "clientIp": "::1"
}
```

### 12. Missing Credentials (Warning)
**Log**: `[OIDC] Token request failed - missing credentials`
```json
{
  "client_id": "your-app-client",
  "has_grant_type": true,
  "has_client_secret": false
}
```

### 13. Processing Authorization Code Grant
**Log**: `[OIDC] Processing authorization_code grant`
```json
{
  "client_id": "your-app-client",
  "redirect_uri": "http://localhost:5176/callback",
  "code_length": 64
}
```

### 14. Missing Code or Redirect URI (Warning)
**Log**: `[OIDC] Token exchange failed - missing code or redirect_uri`
```json
{
  "client_id": "your-app-client",
  "has_code": true,
  "has_redirect_uri": false
}
```

### 15. Tokens Generated Successfully
**Log**: `[OIDC] Tokens generated successfully`
```json
{
  "client_id": "your-app-client",
  "has_access_token": true,
  "has_refresh_token": true,
  "has_id_token": true,
  "expires_in": 3600
}
```

### 16. Processing Refresh Token Grant
**Log**: `[OIDC] Processing refresh_token grant`
```json
{
  "client_id": "your-app-client"
}
```

### 17. Missing Refresh Token (Warning)
**Log**: `[OIDC] Token refresh failed - missing refresh_token`
```json
{
  "client_id": "your-app-client"
}
```

### 18. Token Refreshed Successfully
**Log**: `[OIDC] Token refreshed successfully`
```json
{
  "client_id": "your-app-client",
  "has_access_token": true
}
```

### 19. Unsupported Grant Type (Warning)
**Log**: `[OIDC] Token request failed - unsupported grant_type`
```json
{
  "client_id": "your-app-client",
  "grant_type": "implicit"
}
```

### 20. Token Exchange Error
**Log**: `[OIDC] Token exchange error`
```json
{
  "error": "Authorization code expired",
  "client_id": "your-app-client",
  "grant_type": "authorization_code",
  "stack": "Error: Authorization code expired\n    at ..."
}
```

## Filtering Logs

### View All OIDC Logs
```bash
# In development (nodemon output)
npm run dev | grep "\[OIDC\]"

# In log files
cat logs/app.log | grep "\[OIDC\]"
```

### View Only Errors
```bash
npm run dev | grep "\[OIDC\]" | grep "ERROR"
```

### View Only Warnings
```bash
npm run dev | grep "\[OIDC\]" | grep "WARN"
```

### Track Specific Client
```bash
npm run dev | grep "\[OIDC\]" | grep "your-app-client"
```

### Track Specific User
```bash
npm run dev | grep "\[OIDC\]" | grep "user@example.com"
```

## Complete Flow Example

Here's what a successful OIDC flow looks like in the logs:

```
[INFO] [OIDC] Discovery endpoint accessed { baseUrl: "http://localhost:3000", clientIp: "::1" }
[INFO] [OIDC] Authorization request received { client_id: "my-app", response_type: "code", has_pkce: true }
[INFO] [OIDC] User not authenticated - redirecting to login { client_id: "my-app" }
[INFO] [OIDC] Authorization request received { client_id: "my-app", response_type: "code", has_pkce: true }
[INFO] [OIDC] User authenticated - generating authorization code { userId: "uuid", email: "user@example.com" }
[INFO] [OIDC] Authorization code generated successfully { client_id: "my-app", code_length: 64 }
[INFO] [OIDC] Redirecting to client callback { client_id: "my-app", has_state: true }
[INFO] [OIDC] Token request received { grant_type: "authorization_code", client_id: "my-app" }
[INFO] [OIDC] Processing authorization_code grant { client_id: "my-app", code_length: 64 }
[INFO] [OIDC] Tokens generated successfully { has_access_token: true, has_id_token: true }
```

## Troubleshooting with Logs

### Issue: Client can't discover endpoints
**Look for**: `[OIDC] Discovery endpoint accessed`
**If missing**: Server not running or client using wrong URL

### Issue: Authorization fails
**Look for**: `[OIDC] Authorization failed` warnings
**Check**: client_id, redirect_uri, response_type

### Issue: Token exchange fails
**Look for**: `[OIDC] Token exchange error`
**Check**: Authorization code validity, client credentials, PKCE verifier

### Issue: User not redirected after login
**Look for**: `[OIDC] Redirecting to client callback`
**If missing**: Check authorization code generation logs

## Production Considerations

In production, consider:
1. **Reduce Verbosity**: Log only warnings and errors
2. **Sanitize Data**: Remove sensitive information (secrets, full tokens)
3. **Structured Logging**: Use JSON format for log aggregation
4. **Log Rotation**: Prevent disk space issues
5. **Monitoring**: Set up alerts for error patterns
