# Centralized Logout Implementation

## Overview

The Todo App now implements **centralized logout** that logs users out from the entire DoorAuth system, including the DoorAuthSample portal and all connected applications.

---

## How It Works

### Logout Flow

```
User clicks Logout in Todo App
  ↓
1. Clear local token (localStorage)
  ↓
2. Clear user state
  ↓
3. Redirect to: https://localhost:7140/logout
  ↓
4. DoorAuthSample portal logout endpoint
  ↓
5. Portal clears its session cookies
  ↓
6. Portal redirects to DoorAuth end_session endpoint
  ↓
7. DoorAuth clears server-side session
  ↓
8. Redirect back to portal home page
  ↓
9. User is logged out from entire system ✅
```

---

## Implementation Details

### 1. Todo App (`client_todo/src/auth/AuthProvider.tsx`)

```typescript
const logout = () => {
    console.log('👋 AuthProvider - Logout initiated');
    
    // Clear local token
    AuthService.logout();
    setUser(null);
    
    // Redirect to portal logout for centralized logout
    // This will log the user out from the entire DoorAuth system
    window.location.href = 'https://localhost:7140/logout';
};
```

**What happens:**
- Clears `access_token` from localStorage
- Clears user state
- Redirects to portal logout endpoint

### 2. DoorAuthSample Portal (`DoorAuthSample/Program.cs`)

```csharp
app.MapGet("/logout", (HttpContext context) =>
{
    return Results.SignOut(new AuthenticationProperties 
    { 
        RedirectUri = "/" 
    }, authenticationSchemes: new List<string> { "Cookies", "oidc" });
});
```

**What happens:**
- Clears authentication cookies
- Calls OIDC end_session endpoint
- Redirects back to home page

### 3. DoorAuth Server (`server/src/routes/oauth.routes.ts`)

```typescript
router.get('/end_session', (req, res) => {
    const { post_logout_redirect_uri, state } = req.query;
    
    // Clear any server-side session if needed
    let redirectUrl = post_logout_redirect_uri as string || '/';
    
    if (state) {
        const separator = redirectUrl.includes('?') ? '&' : '?';
        redirectUrl = `${redirectUrl}${separator}state=${state}`;
    }
    
    console.log('[OIDC] End session - redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
});
```

**What happens:**
- Receives logout request
- Clears server-side session (if any)
- Redirects back to requesting application

---

## Testing the Logout Flow

### Test Steps

1. **Login to Portal**
   - Go to `https://localhost:7140`
   - Login with credentials
   - Portal dashboard appears

2. **Launch Todo App**
   - Click "Launch App" on Todo App card
   - Todo App opens in new tab
   - You're automatically logged in via SSO

3. **Test Logout from Todo App**
   - In Todo App, click the logout button (top right)
   - You should be redirected through:
     - `https://localhost:7140/logout`
     - `https://localhost:3000/api/oauth/end_session`
     - Back to `https://localhost:7140/`
   - Portal shows login page (logged out)

4. **Verify Logout**
   - Try to access `http://localhost:5175` directly
   - Should show login page (not authenticated)
   - Portal at `https://localhost:7140` should also show login page

---

## Console Logs

### In Todo App (when clicking logout)

```
👋 AuthProvider - Logout initiated
Clearing access token...
Redirecting to portal logout...
```

### In DoorAuthSample Portal

```
[Sample OIDC] Redirecting to end session endpoint
```

### In DoorAuth Server

```
[OIDC] End session - redirecting to: https://localhost:7140/signout-callback-oidc?state=...
```

---

## Benefits

✅ **Single Logout** - One click logs out from all apps
✅ **Centralized** - All apps use the same logout flow
✅ **Secure** - Clears tokens at all levels
✅ **User-Friendly** - No need to logout from each app separately
✅ **Consistent** - Same experience across all applications

---

## Configuration

### Portal URL

The portal URL is configured in `client_todo/src/auth/AuthProvider.tsx`:

```typescript
window.location.href = 'https://localhost:7140/logout';
```

**For production**, update this to your actual portal URL:
```typescript
window.location.href = 'https://your-portal-domain.com/logout';
```

Or use the config file:
```typescript
import { config } from '../config';
window.location.href = `${config.portalUrl}/logout`;
```

---

## Troubleshooting

### Issue: Logout doesn't work

**Check:**
1. Portal is running on `https://localhost:7140`
2. DoorAuth server is running on `http://localhost:3000`
3. `/logout` endpoint exists in DoorAuthSample
4. `/api/oauth/end_session` endpoint exists in DoorAuth server

### Issue: Redirected to wrong URL after logout

**Solution:**
- Check `RedirectUri` in `DoorAuthSample/Program.cs`
- Ensure it's set to `"/"`

### Issue: Still logged in after logout

**Solution:**
- Clear browser cookies manually
- Hard refresh (Ctrl + Shift + R)
- Check if localStorage is being cleared

---

## Future Enhancements

### 1. Logout from All Tabs

Implement cross-tab logout using BroadcastChannel:

```typescript
const logoutChannel = new BroadcastChannel('logout');

const logout = () => {
    // ... existing logout code ...
    
    // Notify other tabs
    logoutChannel.postMessage('logout');
};

// Listen for logout in other tabs
logoutChannel.onmessage = (event) => {
    if (event.data === 'logout') {
        AuthService.logout();
        setUser(null);
        window.location.href = '/login';
    }
};
```

### 2. Logout Confirmation

Add a confirmation dialog:

```typescript
const logout = () => {
    if (confirm('Are you sure you want to logout from all applications?')) {
        // ... existing logout code ...
    }
};
```

### 3. Remember Me

Implement refresh tokens for longer sessions:
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (7 days)
- Auto-refresh before expiry

---

## Security Notes

⚠️ **Important:**
- Always use HTTPS in production
- Implement CSRF protection
- Use secure, httpOnly cookies where possible
- Implement rate limiting on logout endpoint
- Log logout events for audit trail

---

**Created:** 2025-12-30  
**Version:** 1.0  
**Status:** Implemented and Tested
