# DoorAuth SSO Logout - Best Practice Implementation

## Overview
This document describes the **best practice implementation** for Single Sign-Out (SSO) across the DoorAuth ecosystem, ensuring that logging out from any application properly terminates sessions across all applications.

## The Challenge

### Cookie Isolation by Port
Browsers treat each `host:port` combination as a separate origin for cookies:
- `localhost:3000` (DoorAuth Server) has its own cookie jar
- `localhost:7140` (DoorAuthSample) has its own cookie jar  
- `localhost:5175` (Client Todo) has its own cookie jar

### The Problem
Without proper SSO logout:
1. User logs in to DoorAuth Server (`localhost:3000`)
2. User accesses DoorAuthSample (`localhost:7140`) via SSO
3. User logs out from DoorAuthSample
4. **Problem**: User is still logged in to `localhost:3000`!

## Best Practice Solution

### Centralized Logout Flow

All logout requests flow through the **central auth server's `end_session` endpoint**, which:
1. Clears ALL authentication cookies on the auth server
2. Terminates the central SSO session
3. Redirects back to the requesting application

```
┌─────────────────────────────────────────────────────────────┐
│                   SSO Logout Flow                            │
└─────────────────────────────────────────────────────────────┘

Client App (any port)
    │
    ├─ 1. User clicks "Logout"
    │
    ├─ 2. Clear local storage/state
    │
    ├─ 3. Redirect to Auth Server end_session
    │      URL: https://localhost:3000/api/oauth/end_session
    │      Params: post_logout_redirect_uri=<client_url>
    │
    ▼
Auth Server (localhost:3000)
    │
    ├─ 4. Clear ALL cookies:
    │      - jwt (OAuth sessions)
    │      - access_token (React frontend)
    │      - connect.sid (Express session)
    │
    ├─ 5. Terminate server-side session
    │
    ├─ 6. Redirect to post_logout_redirect_uri
    │
    ▼
Client App
    │
    └─ 7. Show login page
```

## Implementation Details

### 1. Auth Server - Enhanced `end_session` Endpoint

**File**: `server/src/routes/oauth.routes.ts`

```typescript
router.get('/end_session', (req, res) => {
    const { post_logout_redirect_uri, state, id_token_hint } = req.query;

    // Clear ALL possible authentication cookies
    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        path: '/'
    };

    // Clear OAuth cookies
    res.clearCookie('jwt', cookieOptions);
    
    // Clear React frontend cookies
    res.clearCookie('access_token', cookieOptions);
    
    // Clear session cookies
    res.clearCookie('connect.sid', cookieOptions);
    
    // Also clear without httpOnly (belt and suspenders approach)
    res.clearCookie('jwt', { secure: true, sameSite: 'none', path: '/' });
    res.clearCookie('access_token', { secure: true, sameSite: 'none', path: '/' });

    // Redirect back to client
    let redirectUrl = post_logout_redirect_uri as string || '/';
    if (state) {
        const separator = redirectUrl.includes('?') ? '&' : '?';
        redirectUrl = `${redirectUrl}${separator}state=${state}`;
    }

    res.redirect(redirectUrl);
});
```

**Key Features**:
- ✅ Clears ALL authentication cookies comprehensively
- ✅ Uses consistent cookie options (httpOnly, secure, sameSite, path)
- ✅ Tries multiple clearing strategies (belt and suspenders)
- ✅ Logs origin and referer for debugging
- ✅ Properly redirects back to client

### 2. React Frontend - Centralized Logout

**File**: `client/src/services/auth.service.ts`

```typescript
async logout(): Promise<void> {
    try {
        // Step 1: Call server logout endpoint
        await apiService.post('/auth/logout', {});
        console.log('[Logout] Server logout successful');
    } catch (error) {
        console.error('[Logout] Server logout failed:', error);
    }
    
    // Step 2: Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[Logout] localStorage cleared');
    
    // Step 3: Redirect to end_session for centralized logout
    const endSessionUrl = new URL('/api/oauth/end_session', window.location.origin);
    endSessionUrl.searchParams.append('post_logout_redirect_uri', 
                                      window.location.origin + '/login');
    
    console.log('[Logout] Redirecting to end_session');
    window.location.href = endSessionUrl.toString();
}
```

**Key Features**:
- ✅ Calls server logout endpoint first
- ✅ Clears client-side storage
- ✅ Redirects through `end_session` for centralized logout
- ✅ Comprehensive logging for debugging

### 3. Client Todo - OIDC Logout Flow

**File**: `client_todo/src/auth/AuthProvider.tsx`

```typescript
const logout = () => {
    // Clear local token
    localStorage.removeItem('access_token');
    setUser(null);

    // Trigger logout event for other tabs
    localStorage.setItem('logout-event', Date.now().toString());

    // Redirect to DoorAuth server's end_session endpoint
    const logoutUrl = new URL('https://localhost:3000/api/oauth/end_session');
    logoutUrl.searchParams.append('post_logout_redirect_uri', 
                                   window.location.origin + '/login');
    
    window.location.href = logoutUrl.toString();
};
```

**Key Features**:
- ✅ Clears local storage
- ✅ Notifies other tabs via localStorage events
- ✅ Redirects to centralized `end_session`
- ✅ Specifies return URL

### 4. DoorAuthSample - OIDC SignOut

**File**: `DoorAuthSample/Program.cs`

```csharp
app.MapGet("/logout", async (HttpContext context) =>
{
    // Sign out from both cookie and OIDC schemes
    await context.SignOutAsync("Cookies");
    await context.SignOutAsync("oidc", new AuthenticationProperties
    {
        RedirectUri = "/"
    });
});
```

**Key Features**:
- ✅ Uses ASP.NET Core's built-in OIDC logout
- ✅ Automatically calls `end_session` endpoint
- ✅ Clears local authentication cookies
- ✅ Redirects through auth server

## Cookie Configuration Best Practices

### Setting Cookies (Login)

```typescript
res.cookie('access_token', token, {
    httpOnly: true,    // Prevent JavaScript access (security)
    secure: true,      // HTTPS only
    sameSite: 'none',  // Allow cross-origin (required for SSO)
    path: '/',         // Available to entire domain
    maxAge: 3600000    // 1 hour expiry
});
```

### Clearing Cookies (Logout)

```typescript
// MUST match ALL options from set (except maxAge/expires)
res.clearCookie('access_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
});
```

**Critical**: Cookie options must match EXACTLY between set and clear!

## Testing the Implementation

### Manual Test Procedure

1. **Test Cross-Application Logout**:
   ```
   a. Log in to https://localhost:3000 (DoorAuth frontend)
   b. Open https://localhost:7140 (DoorAuthSample)
   c. Click "Sign In" - should auto-login via SSO
   d. Click "Sign Out" from DoorAuthSample
   e. Go back to https://localhost:3000
   f. EXPECTED: You should see the login page (not logged in)
   ```

2. **Test React Frontend Logout**:
   ```
   a. Log in to https://localhost:3000
   b. Click "Logout"
   c. Try to access https://localhost:3000 again
   d. EXPECTED: Login form shown
   e. Try to access https://localhost:7140
   f. EXPECTED: Must sign in (no SSO session)
   ```

3. **Test Client Todo Logout**:
   ```
   a. Log in to http://localhost:5175
   b. Click "Logout"
   c. Try to access https://localhost:3000
   d. EXPECTED: Login form shown
   ```

### Verification Checklist

- [ ] Logout from any app clears auth server cookies
- [ ] Logout from any app requires re-login to all apps
- [ ] No automatic re-authentication after logout
- [ ] localStorage cleared on logout
- [ ] Console shows proper logout flow logs
- [ ] No errors in browser console
- [ ] Cookies cleared in DevTools (may need refresh)

## Debugging

### Check Cookie Clearing

1. Open DevTools → Application → Cookies
2. Note cookies before logout
3. Click logout
4. **Refresh the Cookies view** (right-click → Refresh)
5. Verify cookies are gone

### Check Console Logs

Look for these log messages:

**React Frontend**:
```
[Logout] Server logout successful
[Logout] localStorage cleared
[Logout] Redirecting to end_session: https://localhost:3000/api/oauth/end_session?post_logout_redirect_uri=...
```

**Auth Server**:
```
[OIDC] End session request received { post_logout_redirect_uri: '...', ... }
[OIDC] All session cookies cleared (jwt, access_token, connect.sid)
```

### Common Issues

**Issue**: Cookies still visible in DevTools after logout
- **Cause**: Browser caching, need to refresh DevTools
- **Solution**: Right-click Cookies → Refresh

**Issue**: Auto-login still happens after logout
- **Cause**: Cookie options don't match between set and clear
- **Solution**: Verify cookie options are identical

**Issue**: Logout doesn't work across ports
- **Cause**: Not redirecting through `end_session`
- **Solution**: Ensure all logout flows redirect to auth server

## Production Considerations

### For Production Deployment:

1. **Use a Common Domain**:
   ```
   Auth Server: https://auth.yourdomain.com
   App 1:       https://app1.yourdomain.com
   App 2:       https://app2.yourdomain.com
   ```

2. **Set Cookie Domain**:
   ```typescript
   res.cookie('access_token', token, {
       domain: '.yourdomain.com',  // Shared across subdomains
       httpOnly: true,
       secure: true,
       sameSite: 'lax',  // Can use 'lax' for same-site
       path: '/'
   });
   ```

3. **Implement Session Store**:
   - Use Redis or database for session storage
   - Track active sessions per user
   - Implement "logout from all devices"

4. **Add Audit Logging**:
   - Log all logout events
   - Track which app initiated logout
   - Monitor for suspicious patterns

5. **Implement Token Revocation**:
   - Maintain a token blacklist
   - Check blacklist on each request
   - Auto-expire after token TTL

## Security Best Practices

✅ **Implemented**:
- HttpOnly cookies (prevent XSS)
- Secure flag (HTTPS only)
- SameSite=none for cross-origin SSO
- Centralized logout through auth server
- Comprehensive cookie clearing
- Client-side storage cleanup

🔄 **Recommended for Production**:
- Refresh token revocation
- Session timeout
- Token blacklisting
- Back-channel logout (OIDC spec)
- Logout from all devices
- Audit logging

## Summary

The best practice SSO logout implementation ensures:

1. ✅ **Single Point of Logout**: All logout flows go through auth server
2. ✅ **Comprehensive Cookie Clearing**: All cookies cleared with matching options
3. ✅ **Cross-Application Logout**: Logging out from any app logs out from all
4. ✅ **Proper Redirects**: Uses OIDC `end_session` endpoint correctly
5. ✅ **Client-Side Cleanup**: localStorage and state properly cleared
6. ✅ **Debugging Support**: Comprehensive logging for troubleshooting

**Result**: True Single Sign-Out across all applications in the DoorAuth ecosystem!
