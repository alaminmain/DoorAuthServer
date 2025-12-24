# DoorAuth Todo App Registration - Summary

## What We Did

### 1. Fixed Prisma Schema Error ✅
- **Problem**: The `Role` model had a relation to `Application`, but `Application` was missing the opposite relation field
- **Solution**: Added `roles Role[]` to the `Application` model in `schema.prisma`
- **Status**: Schema is now valid and formatted

### 2. Updated Todo App Registration ✅
- **Problem**: The existing todo app registration had the wrong redirect URI (port 5174 instead of 5175)
- **Solution**: Created and ran `scripts/update-todo-redirect.ts` to update the redirect URI
- **Current Registration**:
  ```
  Client ID: todo-app-client
  Client Secret: todo-secret-key
  Redirect URI: http://localhost:5175/callback
  Status: active
  ```

## What You Need to Do Next

### Step 1: Restart the Server
The Prisma client needs to be regenerated, but it's locked because the server is running.

**Option A - Manual Restart:**
1. Stop the server (Ctrl+C in the terminal running `npm run dev` in the server directory)
2. Run: `npx prisma generate`
3. Restart the server: `npm run dev`

**Option B - Let it auto-restart:**
If you're using nodemon or a similar tool, the server should auto-restart and pick up the schema changes.

### Step 2: Test the Login Flow
Once the server is restarted, test the login flow:

1. Navigate to: **http://localhost:5175/**
2. Click "Login with DoorAuth"
3. You'll be redirected to the DoorAuth login page
4. Enter credentials:
   ```json
   {
     "email": "admin@demo.localhost",
     "password": "password123",
     "tenantId": "be32cd76-8926-4f11-a7e0-ffb8966c1b38"
   }
   ```
5. After successful login, you should be redirected back to the Todo app dashboard

## Application Configuration

### Client Todo App (`client_todo/src/auth/authConfig.ts`)
```typescript
{
  authority: 'http://localhost:3000',
  clientId: 'todo-app-client',
  redirectUri: 'http://localhost:5175/callback',
  responseType: 'code',
  scope: 'openid profile email'
}
```

### OAuth Flow
The app uses **OAuth 2.0 Authorization Code Flow with PKCE**:
1. User clicks "Login with DoorAuth"
2. App generates PKCE code verifier and challenge
3. User is redirected to DoorAuth authorize endpoint
4. User logs in on DoorAuth
5. DoorAuth redirects back with authorization code
6. App exchanges code for access token
7. App decodes JWT and stores user info

## Troubleshooting

### If you still get "Unauthorized: No token provided"
This error typically means:
1. The OAuth flow didn't complete successfully
2. The token wasn't stored in localStorage
3. An API call is being made without the token

**Check:**
- Browser console for errors
- Network tab for failed requests
- localStorage to see if `access_token` is stored

### If login redirect fails
- Verify the redirect URI in the database matches exactly: `http://localhost:5175/callback`
- Check that all three services are running:
  - Server: http://localhost:3000
  - DoorAuth Client: http://localhost:5173
  - Todo Client: http://localhost:5175

## Integration Guide Reference

Yes, you should follow the **INTEGRATION_GUIDE.md** for understanding the concepts, but the actual registration is already done for you. The guide explains:
- How OAuth 2.0 works
- How to register applications (already done)
- How to configure client apps (already done)
- How to implement the login flow (already implemented in client_todo)

## Next Steps After Login Works

Once login is working, you can:
1. Add more features to the Todo app
2. Implement role-based access control
3. Add menu permissions
4. Create additional applications following the same pattern
