# DoorAuth Logout Fix - Implementation Summary

## Problem
The sign-out functionality was not working properly in both the `client_todo` React app and the `DoorAuthSample` ASP.NET Core app. After signing out and clicking "Sign In With DoorAuth" again, users were automatically logged back in with their previous profile without being prompted for credentials.

## Root Cause
The issue was caused by **incomplete session cleanup** during logout:

1. **Client-side apps** were only clearing local storage/cookies
2. **Server-side session** (JWT cookie) was not being invalidated
3. When users tried to sign in again, the DoorAuth server still had an active session and automatically re-authenticated them

## Solution Implemented

### 1. Client Todo App (`client_todo`)
**File**: `client_todo/src/auth/AuthProvider.tsx`

**Changes**:
- Modified the `logout()` function to redirect to the DoorAuth server's `end_session` endpoint
- Added `post_logout_redirect_uri` parameter to redirect back to the app's login page after server logout
- This ensures the server-side session is cleared before returning to the client

```typescript
const logout = () => {
    // Clear local token
    localStorage.removeItem('access_token');
    setUser(null);

    // Trigger logout event for other tabs
    localStorage.setItem('logout-event', Date.now().toString());

    // Redirect to DoorAuth server's end_session endpoint
    const logoutUrl = new URL('https://localhost:3000/api/oauth/end_session');
    logoutUrl.searchParams.append('post_logout_redirect_uri', window.location.origin + '/login');
    
    window.location.href = logoutUrl.toString();
};
```

### 2. DoorAuthSample App (`DoorAuthSample`)
**File**: `DoorAuthSample/Program.cs`

**Changes**:
1. **Added required using statement** at the top of the file:
   ```csharp
   using Microsoft.AspNetCore.Authentication;
   ```

2. **Updated logout endpoint** to use `SignOutAsync` for both cookie and OIDC schemes:
   ```csharp
   app.MapGet("/logout", async (HttpContext context) =>
   {
       await context.SignOutAsync("Cookies");
       await context.SignOutAsync("oidc", new AuthenticationProperties
       {
           RedirectUri = "/"
       });
   });
   ```

3. **Added SignedOutCallbackPath** configuration:
   ```csharp
   options.SignedOutCallbackPath = "/signout-callback-oidc";
   ```

### 3. DoorAuth Server (`server`)
**File**: `server/src/routes/oauth.routes.ts`

**Changes**:
- Enhanced the `end_session` endpoint to **clear authentication cookies**:
  ```typescript
  router.get('/end_session', (req, res) => {
      // Clear the JWT authentication cookie
      res.clearCookie('jwt', {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          path: '/'
      });
      
      // Clear session cookie
      res.clearCookie('connect.sid');
      
      // Redirect to post_logout_redirect_uri
      res.redirect(post_logout_redirect_uri);
  });
  ```

### 4. Database Configuration
**File**: `server/prisma/seed.ts`

**Changes**:
- Updated `DoorAuthSample` application to include `signout-callback-oidc` redirect URI:
  ```typescript
  redirectUris: 'https://localhost:7140/signin-oidc,https://localhost:7140/signout-callback-oidc'
  ```
- Added `appUrl` to the Todo app configuration for dashboard visibility

## Testing Instructions

### Test 1: Client Todo App Logout
1. Navigate to `https://localhost:5175`
2. Click "Sign In With DoorAuth"
3. Log in with credentials (e.g., `admin@demo.localhost` / `password123`)
4. Verify you're logged in and can see the todo list
5. Click "Logout"
6. **Expected**: You should be redirected to the login page
7. Click "Sign In With DoorAuth" again
8. **Expected**: You should see the DoorAuth login form, NOT be automatically logged in

### Test 2: DoorAuthSample Logout
1. Navigate to `https://localhost:7140`
2. Click "Sign In with DoorAuth"
3. Log in with credentials
4. Verify you see the dashboard with your applications
5. Click "Sign Out"
6. **Expected**: You should be redirected to the home page (logged out state)
7. Click "Sign In with DoorAuth" again
8. **Expected**: You should see the DoorAuth login form, NOT be automatically logged in

### Test 3: Cross-Application Logout (SSO Logout)
1. Log in to the DoorAuthSample app
2. Launch the Todo App from the dashboard
3. Verify you're automatically logged into the Todo App (SSO)
4. Log out from the Todo App
5. **Expected**: You should be logged out from the entire DoorAuth system
6. Try to access DoorAuthSample
7. **Expected**: You should need to log in again

## Files Modified

1. `client_todo/src/auth/AuthProvider.tsx` - Updated logout logic
2. `DoorAuthSample/Program.cs` - Updated logout endpoint and OIDC configuration
3. `server/src/routes/oauth.routes.ts` - Enhanced end_session endpoint
4. `server/prisma/seed.ts` - Updated redirect URIs and app URLs

## Technical Details

### OIDC Logout Flow
The implementation follows the OpenID Connect RP-Initiated Logout specification:

1. **Client initiates logout**: Redirects to `end_session` endpoint with `post_logout_redirect_uri`
2. **Server clears session**: Removes JWT cookie and any session data
3. **Server redirects back**: Returns user to the specified `post_logout_redirect_uri`
4. **Client completes cleanup**: Clears local storage and updates UI state

### Cookie Configuration
The JWT cookie is cleared with the following settings:
- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - Only sent over HTTPS
- `sameSite: 'none'` - Allows cross-site requests (needed for SSO)
- `path: '/'` - Applies to entire domain

## Known Limitations

1. **Multi-tab logout**: The current implementation uses localStorage events to sync logout across tabs for the React app. This works within the same browser but not across different browsers.

2. **Session timeout**: There's no automatic session timeout implemented. Sessions remain active until explicit logout.

3. **Refresh token revocation**: The current implementation doesn't revoke refresh tokens on logout. This should be added for production use.

## Future Improvements

1. **Implement refresh token revocation** on logout
2. **Add session timeout** with automatic logout
3. **Implement "logout from all devices"** functionality
4. **Add logout confirmation dialog** for better UX
5. **Implement back-channel logout** for more robust SSO logout

## Verification Checklist

- [x] Client Todo app clears local storage on logout
- [x] Client Todo app redirects to server end_session endpoint
- [x] DoorAuthSample uses proper SignOutAsync for OIDC
- [x] Server end_session endpoint clears JWT cookie
- [x] Server end_session endpoint redirects to post_logout_redirect_uri
- [x] Database has correct redirect URIs configured
- [x] Seed script updated with new configuration

## Notes

- All changes are backward compatible
- No database schema changes required
- The seed script was re-run to update existing applications
- All running servers will need to be restarted to pick up the changes
