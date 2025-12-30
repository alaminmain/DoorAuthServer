# Testing SSO Portal Integration - Todo App

This guide walks you through testing the SSO integration between DoorAuthSample portal and the Todo App.

---

## 🎯 What We've Implemented

The Todo App now supports **two authentication methods**:

1. **Direct OAuth Login** - Traditional OAuth 2.0 PKCE flow
2. **SSO Portal Login** - Single Sign-On from DoorAuthSample dashboard ⭐ NEW

---

## 🔧 Changes Made

### 1. New SSO Handler (`src/pages/SSOHandler.tsx`)
- Receives SSO token from URL parameter
- Validates token expiry
- Stores token in localStorage
- Redirects to dashboard

### 2. Updated App Router (`src/App.tsx`)
- Added `/sso` route for SSO token handling
- Maintains existing `/login` and `/callback` routes

### 3. Enhanced Auth Provider (`src/auth/AuthProvider.tsx`)
- Added `handleSSOToken()` method
- Validates and stores SSO tokens
- Updates user state

### 4. Improved Login Page (`src/pages/Login.tsx`)
- Added SSO portal information
- Link to DoorAuthSample portal
- Better visual design

---

## 🚀 Testing Steps

### Prerequisites

Ensure all services are running:

```bash
# Terminal 1: DoorAuth Server
cd server
npm run dev
# Should be on http://localhost:3000

# Terminal 2: DoorAuthSample Portal
cd DoorAuthSample
dotnet run --launch-profile "https"
# Should be on https://localhost:7140

# Terminal 3: Todo App
cd client_todo
npm run dev
# Should be on http://localhost:5175
```

---

## Test 1: SSO Portal Flow (Recommended)

### Step 1: Verify App Registration

Check that Todo App is registered in the database:

```sql
SELECT 
    name, 
    "clientId", 
    "appUrl", 
    "isActive" 
FROM "Application" 
WHERE "clientId" = 'todo-app-client';
```

**Expected Result:**
```
name      | clientId         | appUrl                    | isActive
----------|------------------|---------------------------|----------
Todo App  | todo-app-client  | http://localhost:5175     | true
```

If `appUrl` is missing, update it:

```sql
UPDATE "Application" 
SET "appUrl" = 'http://localhost:5175'
WHERE "clientId" = 'todo-app-client';
```

### Step 2: Login to Portal

1. Open browser: `https://localhost:7140`
2. You should see the DoorAuthSample login page
3. Enter credentials:
   - Email: (your test user email)
   - Password: (your test user password)
4. Click "Login"

### Step 3: Verify App Card

After login, you should see:
- Dashboard with application cards
- "Todo App" card should be visible
- Card should show app name and description

### Step 4: Launch Todo App via SSO

1. Click on the "Todo App" card
2. A new tab/window should open
3. URL should be: `http://localhost:5175/sso?token=eyJhbGc...`
4. You should see "Processing SSO authentication..."
5. After validation, you'll be redirected to the Todo dashboard
6. **You should be automatically logged in!**

### Step 5: Verify SSO Login

Check browser DevTools:
1. Open DevTools (F12)
2. Go to Application → Local Storage → `http://localhost:5175`
3. Verify `access_token` is stored
4. Copy the token and decode it at [jwt.io](https://jwt.io)
5. Verify user info matches your portal login

### Step 6: Test Navigation

1. Refresh the page - you should stay logged in
2. Navigate to different sections
3. Logout and verify redirect

---

## Test 2: Direct OAuth Flow (Fallback)

### Step 1: Clear Session

1. Open Todo App: `http://localhost:5175`
2. If logged in, click Logout
3. Clear localStorage (DevTools → Application → Local Storage → Clear All)

### Step 2: Direct Login

1. You should see the Login page
2. Notice the "SSO Portal Available" section
3. Click "Login with DoorAuth" button
4. You'll be redirected to DoorAuth login page
5. Enter credentials
6. After login, you'll be redirected back to Todo App
7. You should be logged in

---

## Test 3: Token Validation

### Test Expired Token

1. Get a valid SSO token from the portal
2. Manually create an expired token URL:
   ```
   http://localhost:5175/sso?token=EXPIRED_TOKEN_HERE
   ```
3. Navigate to this URL
4. You should see an error message
5. You'll be redirected to the portal after 3 seconds

### Test Invalid Token

1. Navigate to:
   ```
   http://localhost:5175/sso?token=invalid-token-123
   ```
2. You should see "Invalid SSO token" error
3. You'll be redirected to login page

### Test Missing Token

1. Navigate to:
   ```
   http://localhost:5175/sso
   ```
2. You should see "No SSO token provided" error
3. You'll be redirected to login page

---

## 🔍 Debugging

### Check Browser Console

Open DevTools Console and look for:

**Successful SSO:**
```
Validating token...
Token validated. Logging you in...
```

**Failed SSO:**
```
SSO token validation error: ...
Invalid SSO token
```

### Check Network Tab

1. Open DevTools → Network tab
2. Launch app from portal
3. Look for the redirect to `/sso?token=...`
4. Verify token is in the URL

### Check DoorAuth Server Logs

If SSO isn't working, check server logs for:
- Token generation
- User authentication
- Any errors

---

## 📊 Expected Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User opens DoorAuthSample Portal                         │
│    https://localhost:7140                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User logs in with credentials                            │
│    Portal validates & creates session                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Portal displays app cards                                │
│    Todo App card shows with appUrl                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User clicks "Todo App" card                              │
│    Portal opens: http://localhost:5175/sso?token=JWT_TOKEN  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SSOHandler component receives token                      │
│    - Validates token expiry                                  │
│    - Stores in localStorage                                  │
│    - Cleans URL (removes token)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Redirect to Dashboard                                    │
│    User is authenticated!                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Success Criteria

- [ ] Portal shows Todo App card
- [ ] Clicking card opens Todo App in new tab
- [ ] SSO token is in URL initially
- [ ] Token is validated successfully
- [ ] Token is stored in localStorage
- [ ] URL is cleaned (token removed)
- [ ] User is redirected to dashboard
- [ ] User info is displayed correctly
- [ ] Refresh keeps user logged in
- [ ] Logout works correctly

---

## 🐛 Common Issues

### Issue: App card not showing in portal

**Solution:**
- Verify `appUrl` is set in database
- Check user has permission to access the app
- Restart DoorAuthSample portal

### Issue: Token not received

**Solution:**
- Check portal is passing token in URL
- Verify URL format: `/sso?token=...`
- Check browser console for errors

### Issue: "Token expired" error

**Solution:**
- Token might have expired during testing
- Re-login to portal to get fresh token
- Check server time synchronization

### Issue: Infinite redirect loop

**Solution:**
- Clear localStorage
- Clear browser cookies
- Restart all services

---

## 📝 Next Steps

After successful testing:

1. **Update DoorAuthSample** to properly pass tokens
2. **Add role-based access** to show/hide apps
3. **Implement refresh tokens** for better UX
4. **Add logout from portal** to clear all app sessions
5. **Enhance error handling** with better user messages

---

## 🔐 Security Notes

- ✅ Token is removed from URL after validation
- ✅ Token expiry is checked before use
- ✅ Invalid tokens are rejected
- ✅ HTTPS should be used in production
- ⚠️ Token is visible in URL briefly (acceptable for SSO)
- ⚠️ Use short-lived tokens (recommended: 1 hour)

---

**Created:** 2025-12-30  
**Version:** 1.0  
**Status:** Ready for Testing
