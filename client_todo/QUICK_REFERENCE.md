# DoorAuth Integration - Quick Reference

## 🚀 Quick Start

```bash
# 1. Start DoorAuth Server
cd server
npm run dev

# 2. Start Todo App
cd client_todo
npm run dev

# 3. Open browser
http://localhost:5175
```

---

## 📝 Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `src/auth/authConfig.ts` | OAuth configuration (URLs, client ID, scopes) |
| `src/auth/AuthProvider.tsx` | Global auth state management |
| `src/services/AuthService.ts` | OAuth 2.0 PKCE implementation |
| `src/pages/Login.tsx` | Login page with DoorAuth button |
| `src/pages/Callback.tsx` | OAuth callback handler |
| `src/App.tsx` | Routing and protected routes |

---

## 🔑 Authentication Flow Cheat Sheet

### Login Process
```
User clicks login
  → Generate PKCE verifier & challenge
  → Redirect to DoorAuth /authorize
  → User logs in
  → Redirect to /callback with code
  → Exchange code for token
  → Store token in localStorage
  → Decode token to get user info
  → Redirect to dashboard
```

### Token Storage
```typescript
// Store token
localStorage.setItem('access_token', token);

// Get token
const token = localStorage.getItem('access_token');

// Remove token (logout)
localStorage.removeItem('access_token');
```

### Using Auth in Components
```typescript
import { useAuth } from './auth/AuthProvider';

function MyComponent() {
    const { user, isAuthenticated, login, logout } = useAuth();
    
    if (!isAuthenticated) {
        return <button onClick={login}>Login</button>;
    }
    
    return (
        <div>
            <p>Welcome, {user?.email}</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
```

---

## 🔧 Configuration Checklist

### DoorAuth Server
- [ ] Server running on `http://localhost:3000`
- [ ] App registered with client ID: `todo-app-client`
- [ ] Client secret: `todo-secret-key`
- [ ] Redirect URI: `http://localhost:5175/callback`
- [ ] Scopes: `openid profile email`

### Todo App
- [ ] Running on port `5175`
- [ ] `authConfig.ts` has correct authority URL
- [ ] `authConfig.ts` has correct client ID
- [ ] `authConfig.ts` has correct redirect URI

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "No PKCE verifier found" | Don't clear localStorage between login and callback |
| "Invalid redirect_uri" | Check redirect URI matches exactly in config and database |
| CORS errors | Add `http://localhost:5175` to CORS origins in server |
| "Token expired" | Just log in again - app auto-detects expiry |
| Infinite redirect loop | Check if token is valid and not expired |

---

## 📊 API Endpoints

### DoorAuth Server Endpoints

```
POST /api/oauth/authorize
  - Initiates OAuth flow
  - Query params: client_id, redirect_uri, response_type, scope, code_challenge, code_challenge_method

POST /api/oauth/token
  - Exchanges code for token
  - Body: grant_type, client_id, client_secret, code, redirect_uri, code_verifier
  - Returns: { access_token, token_type, expires_in }
```

---

## 🧪 Testing Commands

```bash
# Check if token is stored
localStorage.getItem('access_token')

# Decode token (in browser console)
JSON.parse(atob(localStorage.getItem('access_token').split('.')[1]))

# Clear all auth data
localStorage.clear()

# Check PKCE verifier (during login flow)
localStorage.getItem('pkce_verifier')
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.11.0",
    "axios": "^1.13.2",
    "jwt-decode": "^4.0.0"
  }
}
```

---

## 🎯 Protected Route Pattern

```typescript
// Wrap any component to make it protected
<ProtectedRoute>
    <YourComponent />
</ProtectedRoute>

// Or in routes
<Route path="/protected" element={
    <ProtectedRoute>
        <ProtectedPage />
    </ProtectedRoute>
} />
```

---

## 💡 Tips & Best Practices

1. **Always check token expiry** before making API calls
2. **Store sensitive data** (like client_secret) in environment variables for production
3. **Use HTTPS** in production (not HTTP)
4. **Implement refresh tokens** for better UX
5. **Add error boundaries** to catch auth errors gracefully
6. **Log auth events** for debugging
7. **Clear tokens on logout** to prevent security issues

---

## 🔐 Security Checklist

- [x] Using PKCE (not implicit flow)
- [x] Storing tokens in localStorage (consider httpOnly cookies for production)
- [x] Validating token expiry
- [x] Using HTTPS in production
- [ ] Implementing CSRF protection
- [ ] Adding rate limiting
- [ ] Implementing refresh tokens
- [ ] Using secure client_secret storage

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check DoorAuth server logs
3. Verify database entries
4. Review this guide
5. Check the full tutorial: `DOORAUTH_INTEGRATION_TUTORIAL.md`

---

**Last Updated:** 2025-12-30
