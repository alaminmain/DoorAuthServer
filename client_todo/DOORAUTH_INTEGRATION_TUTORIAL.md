# DoorAuth Integration Tutorial for React Todo App

This tutorial explains how the **client_todo** React application integrates with the **DoorAuth** authentication server using OAuth 2.0 with PKCE (Proof Key for Code Exchange) flow.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Configuration](#configuration)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The **client_todo** app is a React-based Todo application that uses:
- **OAuth 2.0 Authorization Code Flow with PKCE** for secure authentication
- **JWT tokens** for session management
- **React Context API** for global auth state
- **React Router** for protected routes

### Key Features:
✅ Secure login via DoorAuth server  
✅ Token-based authentication  
✅ Protected routes  
✅ Automatic token validation  
✅ Logout functionality  

---

## 📦 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
2. **DoorAuth Server** running on `http://localhost:3000`
3. **Todo App** registered in DoorAuth with:
   - Client ID: `todo-app-client`
   - Client Secret: `todo-secret-key`
   - Redirect URI: `http://localhost:5175/callback`

---

## 🏗️ Architecture

### Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │         │              │         │             │
│  React App  │────────▶│  DoorAuth    │────────▶│  Database   │
│ (Port 5175) │         │  Server      │         │  (Prisma)   │
│             │◀────────│ (Port 3000)  │◀────────│             │
└─────────────┘         └──────────────┘         └─────────────┘
```

### OAuth 2.0 PKCE Flow

```
1. User clicks "Login"
   ↓
2. App generates PKCE verifier & challenge
   ↓
3. Redirect to DoorAuth /authorize
   ↓
4. User logs in on DoorAuth
   ↓
5. DoorAuth redirects to /callback with code
   ↓
6. App exchanges code + verifier for token
   ↓
7. Store JWT token in localStorage
   ↓
8. Decode token to get user info
   ↓
9. User is authenticated!
```

---

## 🚀 Step-by-Step Integration

### Step 1: Install Dependencies

```bash
cd client_todo
npm install
```

**Key packages:**
- `react-router-dom` - Routing
- `axios` - HTTP client
- `jwt-decode` - JWT token decoding

### Step 2: Configure Authentication Settings

**File:** `src/auth/authConfig.ts`

```typescript
export const authConfig = {
    authority: 'http://localhost:3000',           // DoorAuth server URL
    clientId: 'todo-app-client',                  // Your app's client ID
    redirectUri: 'http://localhost:5175/callback', // OAuth callback URL
    responseType: 'code',                          // Authorization code flow
    scope: 'openid profile email'                  // Requested scopes
};
```

**What to customize:**
- `authority`: Your DoorAuth server URL
- `clientId`: Your registered app's client ID
- `redirectUri`: Must match the redirect URI registered in DoorAuth

### Step 3: Create Authentication Service

**File:** `src/services/AuthService.ts`

This service handles all OAuth 2.0 operations:

#### 3.1 PKCE Generation

```typescript
async generatePKCE() {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateCodeChallenge(verifier);
    localStorage.setItem('pkce_verifier', verifier);
    return { verifier, challenge };
}
```

**Purpose:** Creates a cryptographically secure code verifier and challenge for PKCE.

#### 3.2 Login Function

```typescript
async login() {
    const { challenge } = await this.generatePKCE();
    const params = new URLSearchParams({
        client_id: authConfig.clientId,
        redirect_uri: authConfig.redirectUri,
        response_type: authConfig.responseType,
        scope: authConfig.scope,
        code_challenge: challenge,
        code_challenge_method: 'S256'
    });
    window.location.href = `${authConfig.authority}/api/oauth/authorize?${params.toString()}`;
}
```

**What happens:**
1. Generates PKCE challenge
2. Builds authorization URL with parameters
3. Redirects user to DoorAuth login page

#### 3.3 Handle Callback

```typescript
async handleCallback(code: string) {
    const verifier = localStorage.getItem('pkce_verifier');
    if (!verifier) throw new Error('No PKCE verifier found');

    const response = await axios.post(`${authConfig.authority}/api/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: authConfig.clientId,
        client_secret: 'todo-secret-key',
        code,
        redirect_uri: authConfig.redirectUri,
        code_verifier: verifier
    });

    const token = response.data.access_token || response.data.data?.access_token;
    
    if (token) {
        localStorage.setItem('access_token', token);
        localStorage.removeItem('pkce_verifier');
        return token;
    }
    throw new Error('No access token received');
}
```

**What happens:**
1. Retrieves PKCE verifier from localStorage
2. Exchanges authorization code for access token
3. Stores token in localStorage
4. Cleans up PKCE verifier

### Step 4: Create Auth Context Provider

**File:** `src/auth/AuthProvider.tsx`

#### 4.1 Define User Interface

```typescript
interface User {
    userId: string;
    email: string;
    tenantId: string;
    sub?: string;
    name?: string;
    exp: number;
    roles?: string[];
    permissions?: string[];
}
```

#### 4.2 Create Auth Context

```typescript
interface AuthContextType {
    user: User | null;
    login: () => void;
    logout: () => void;
    isAuthenticated: boolean;
    handleCallback: (code: string) => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
```

#### 4.3 Implement Auth Provider

```typescript
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = AuthService.getToken();
        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    AuthService.logout();
                    setUser(null);
                } else {
                    setUser(decoded);
                }
            } catch (e) {
                console.error('Invalid token', e);
                localStorage.removeItem('access_token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = () => {
        AuthService.login();
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
    };

    const handleCallback = async (code: string) => {
        setIsLoading(true);
        try {
            const token = await AuthService.handleCallback(code);
            const decoded = jwtDecode<User>(token);
            setUser(decoded);
        } catch (e) {
            console.error('Callback error', e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user,
            handleCallback,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
```

**Key features:**
- ✅ Automatic token validation on mount
- ✅ Token expiry checking
- ✅ Global auth state management
- ✅ Loading states

### Step 5: Create Login Page

**File:** `src/pages/Login.tsx`

```typescript
import { useAuth } from '../auth/AuthProvider';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Todo App</h1>
                <button
                    onClick={login}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Login with DoorAuth
                </button>
            </div>
        </div>
    );
}
```

### Step 6: Create Callback Handler

**File:** `src/pages/Callback.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Callback() {
    const [searchParams] = useSearchParams();
    const { handleCallback } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleCallback(code)
                .then(() => navigate('/'))
                .catch((err) => {
                    console.error('Callback error:', err);
                    setError('Authentication failed. Please try again.');
                });
        } else {
            setError('No authorization code received');
        }
    }, [searchParams, handleCallback, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div>Processing authentication...</div>
        </div>
    );
}
```

### Step 7: Create Protected Route Component

**File:** `src/App.tsx`

```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
```

### Step 8: Set Up Routing

**File:** `src/App.tsx`

```typescript
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/callback" element={<Callback />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
```

### Step 9: Configure Vite Dev Server

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5175,  // Must match redirectUri port
    },
})
```

---

## ⚙️ Configuration

### DoorAuth Server Setup

Ensure your app is registered in the DoorAuth database:

```sql
-- Check if app exists
SELECT * FROM "Application" WHERE "clientId" = 'todo-app-client';

-- If not, insert it
INSERT INTO "Application" (
    id, name, "clientId", "clientSecret", "redirectUris", 
    "allowedScopes", "isActive", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(),
    'Todo App',
    'todo-app-client',
    'todo-secret-key',
    ARRAY['http://localhost:5175/callback'],
    ARRAY['openid', 'profile', 'email'],
    true,
    NOW(),
    NOW()
);
```

### Environment Variables (Optional)

Create `.env` file:

```env
VITE_AUTH_AUTHORITY=http://localhost:3000
VITE_CLIENT_ID=todo-app-client
VITE_REDIRECT_URI=http://localhost:5175/callback
```

Update `authConfig.ts`:

```typescript
export const authConfig = {
    authority: import.meta.env.VITE_AUTH_AUTHORITY || 'http://localhost:3000',
    clientId: import.meta.env.VITE_CLIENT_ID || 'todo-app-client',
    redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5175/callback',
    responseType: 'code',
    scope: 'openid profile email'
};
```

---

## 🧪 Testing the Integration

### 1. Start DoorAuth Server

```bash
cd server
npm run dev
```

Server should be running on `http://localhost:3000`

### 2. Start Todo App

```bash
cd client_todo
npm run dev
```

App should be running on `http://localhost:5175`

### 3. Test Login Flow

1. **Navigate to** `http://localhost:5175`
2. **Click** "Login with DoorAuth"
3. **You'll be redirected to** `http://localhost:3000/api/oauth/authorize?...`
4. **Enter credentials** on DoorAuth login page
5. **After successful login**, you'll be redirected to `http://localhost:5175/callback?code=...`
6. **The app will exchange the code for a token** and redirect to dashboard
7. **You should see** your todo dashboard with user info

### 4. Verify Token

Open browser DevTools → Application → Local Storage:
- `access_token`: Should contain a JWT token
- Decode it at [jwt.io](https://jwt.io) to verify user info

### 5. Test Logout

Click logout button → Should clear token and redirect to login

---

## 🔧 Troubleshooting

### Issue 1: "No PKCE verifier found"

**Cause:** PKCE verifier was cleared before callback  
**Solution:** Don't clear browser storage between login and callback

### Issue 2: "Invalid redirect_uri"

**Cause:** Redirect URI doesn't match registered URI  
**Solution:** Ensure `authConfig.redirectUri` matches database entry exactly

### Issue 3: "Token expired"

**Cause:** JWT token has expired  
**Solution:** The app automatically checks expiry and logs out. Just log in again.

### Issue 4: CORS errors

**Cause:** DoorAuth server not allowing requests from `http://localhost:5175`  
**Solution:** Add CORS configuration in DoorAuth server:

```typescript
// In server/src/index.ts
app.use(cors({
    origin: ['http://localhost:5175', 'http://localhost:5173'],
    credentials: true
}));
```

### Issue 5: "No access token received"

**Cause:** Token exchange failed  
**Solution:** 
1. Check DoorAuth server logs
2. Verify client_secret matches database
3. Ensure authorization code is valid

---

## 📚 Additional Resources

- [OAuth 2.0 PKCE Flow](https://oauth.net/2/pkce/)
- [JWT.io - Token Decoder](https://jwt.io)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)

---

## 🎉 Summary

You now have a fully integrated React Todo app with DoorAuth authentication!

**Key takeaways:**
- ✅ OAuth 2.0 PKCE flow for secure authentication
- ✅ JWT tokens for session management
- ✅ Protected routes with React Router
- ✅ Global auth state with Context API
- ✅ Automatic token validation and expiry checking

**Next steps:**
- Add refresh token support
- Implement role-based access control
- Add multi-tenant support
- Enhance error handling

---

**Created:** 2025-12-30  
**Version:** 1.0  
**Author:** DoorAuth Team
