# DoorAuth Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │           React Todo App (localhost:5175)                   │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │   Login      │  │   Callback   │  │  Dashboard   │    │    │
│  │  │   Page       │  │   Handler    │  │   (Protected)│    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │    │
│  │         │                  │                  │            │    │
│  │         └──────────────────┴──────────────────┘            │    │
│  │                            │                                │    │
│  │                   ┌────────▼────────┐                      │    │
│  │                   │  AuthProvider   │                      │    │
│  │                   │  (Context API)  │                      │    │
│  │                   └────────┬────────┘                      │    │
│  │                            │                                │    │
│  │                   ┌────────▼────────┐                      │    │
│  │                   │  AuthService    │                      │    │
│  │                   │  (PKCE Logic)   │                      │    │
│  │                   └────────┬────────┘                      │    │
│  │                            │                                │    │
│  └────────────────────────────┼────────────────────────────────┘    │
│                               │                                     │
│                               │ HTTP Requests                       │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                                │
                    ┌───────────▼───────────┐
                    │                       │
                    │   DoorAuth Server     │
                    │   (localhost:3000)    │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │ OAuth Routes    │  │
                    │  │ /authorize      │  │
                    │  │ /token          │  │
                    │  └────────┬────────┘  │
                    │           │           │
                    │  ┌────────▼────────┐  │
                    │  │ Auth Controller │  │
                    │  └────────┬────────┘  │
                    │           │           │
                    │  ┌────────▼────────┐  │
                    │  │ Auth Service    │  │
                    │  └────────┬────────┘  │
                    │           │           │
                    └───────────┼───────────┘
                                │
                                │
                    ┌───────────▼───────────┐
                    │                       │
                    │   PostgreSQL DB       │
                    │   (Prisma)            │
                    │                       │
                    │  ┌─────────────────┐  │
                    │  │ Application     │  │
                    │  │ User            │  │
                    │  │ Tenant          │  │
                    │  │ AuthCode        │  │
                    │  └─────────────────┘  │
                    │                       │
                    └───────────────────────┘
```

---

## OAuth 2.0 PKCE Flow Sequence

```
┌────────┐                ┌──────────┐                ┌──────────┐
│ User   │                │ Todo App │                │ DoorAuth │
└───┬────┘                └────┬─────┘                └────┬─────┘
    │                          │                           │
    │  1. Click "Login"        │                           │
    ├─────────────────────────▶│                           │
    │                          │                           │
    │                          │ 2. Generate PKCE          │
    │                          │    verifier & challenge   │
    │                          │                           │
    │                          │ 3. Redirect to /authorize │
    │                          ├──────────────────────────▶│
    │                          │   ?client_id=...          │
    │                          │   &redirect_uri=...       │
    │                          │   &code_challenge=...     │
    │                          │                           │
    │  4. Show Login Form      │                           │
    │◀─────────────────────────┼───────────────────────────┤
    │                          │                           │
    │  5. Enter Credentials    │                           │
    ├──────────────────────────┼──────────────────────────▶│
    │                          │                           │
    │                          │ 6. Validate & Create Code │
    │                          │                           │
    │  7. Redirect to /callback│                           │
    │◀─────────────────────────┼───────────────────────────┤
    │    ?code=AUTH_CODE       │                           │
    │                          │                           │
    │                          │ 8. Extract code from URL  │
    │                          │                           │
    │                          │ 9. POST /token            │
    │                          ├──────────────────────────▶│
    │                          │   code=AUTH_CODE          │
    │                          │   code_verifier=...       │
    │                          │   client_id=...           │
    │                          │                           │
    │                          │ 10. Validate & Issue Token│
    │                          │                           │
    │                          │ 11. Return access_token   │
    │                          │◀──────────────────────────┤
    │                          │                           │
    │                          │ 12. Store token           │
    │                          │     Decode JWT            │
    │                          │     Set user state        │
    │                          │                           │
    │  13. Show Dashboard      │                           │
    │◀─────────────────────────┤                           │
    │                          │                           │
```

---

## Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── BrowserRouter
│       └── Routes
│           ├── /login → Login
│           │             └── useAuth() → login()
│           │
│           ├── /callback → Callback
│           │                └── useAuth() → handleCallback()
│           │
│           └── / → ProtectedRoute
│                    └── Dashboard
│                         └── useAuth() → user, logout()
```

---

## Data Flow

### 1. Login Initiation
```
Login Component
    │
    ├─ useAuth() hook
    │   └─ login() function
    │       └─ AuthService.login()
    │           ├─ Generate PKCE verifier
    │           ├─ Generate code challenge
    │           ├─ Store verifier in localStorage
    │           └─ Redirect to DoorAuth /authorize
```

### 2. OAuth Callback
```
Callback Component
    │
    ├─ Extract 'code' from URL
    │
    ├─ useAuth() hook
    │   └─ handleCallback(code)
    │       └─ AuthService.handleCallback()
    │           ├─ Get verifier from localStorage
    │           ├─ POST to /token with code + verifier
    │           ├─ Receive access_token
    │           ├─ Store token in localStorage
    │           └─ Decode JWT to get user info
    │
    └─ Navigate to Dashboard
```

### 3. Protected Access
```
Dashboard Component
    │
    ├─ ProtectedRoute wrapper
    │   ├─ useAuth() hook
    │   │   ├─ Check isAuthenticated
    │   │   └─ Check isLoading
    │   │
    │   ├─ If loading: Show "Loading..."
    │   ├─ If not authenticated: Redirect to /login
    │   └─ If authenticated: Render Dashboard
    │
    └─ Display user info from decoded token
```

---

## State Management

### AuthProvider State
```typescript
{
    user: {
        userId: string,
        email: string,
        tenantId: string,
        name?: string,
        roles?: string[],
        permissions?: string[],
        exp: number
    } | null,
    
    isAuthenticated: boolean,
    isLoading: boolean
}
```

### LocalStorage Data
```typescript
{
    'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'pkce_verifier': 'abc123...' // Only during login flow
}
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: PKCE (Proof Key for Code Exchange)        │
│ - Prevents authorization code interception          │
│ - Uses cryptographic verifier & challenge           │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ Layer 2: JWT Token Validation                      │
│ - Signed tokens prevent tampering                   │
│ - Expiry time prevents replay attacks               │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ Layer 3: Protected Routes                          │
│ - Client-side route protection                      │
│ - Automatic redirect to login if unauthenticated    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│ Layer 4: API Authorization (Future)                │
│ - Bearer token in API requests                      │
│ - Server-side token validation                      │
└─────────────────────────────────────────────────────┘
```

---

## File Structure

```
client_todo/
├── src/
│   ├── auth/
│   │   ├── authConfig.ts          # OAuth configuration
│   │   └── AuthProvider.tsx       # Auth context & state
│   │
│   ├── services/
│   │   ├── AuthService.ts         # PKCE & OAuth logic
│   │   └── TodoService.ts         # Todo API calls
│   │
│   ├── pages/
│   │   ├── Login.tsx              # Login page
│   │   ├── Callback.tsx           # OAuth callback handler
│   │   └── Dashboard.tsx          # Main app (protected)
│   │
│   ├── App.tsx                    # Routing & ProtectedRoute
│   └── main.tsx                   # App entry point
│
├── vite.config.ts                 # Vite configuration
├── package.json                   # Dependencies
├── DOORAUTH_INTEGRATION_TUTORIAL.md
├── QUICK_REFERENCE.md
└── ARCHITECTURE.md                # This file
```

---

## Request/Response Examples

### 1. Authorization Request
```http
GET /api/oauth/authorize?
    client_id=todo-app-client&
    redirect_uri=http://localhost:5175/callback&
    response_type=code&
    scope=openid%20profile%20email&
    code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
    code_challenge_method=S256
```

### 2. Token Request
```http
POST /api/oauth/token
Content-Type: application/json

{
    "grant_type": "authorization_code",
    "client_id": "todo-app-client",
    "client_secret": "todo-secret-key",
    "code": "AUTH_CODE_HERE",
    "redirect_uri": "http://localhost:5175/callback",
    "code_verifier": "VERIFIER_HERE"
}
```

### 3. Token Response
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

### 4. Decoded JWT Token
```json
{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "tenantId": "tenant-123",
    "name": "John Doe",
    "roles": ["user"],
    "permissions": ["read:todos", "write:todos"],
    "iat": 1704000000,
    "exp": 1704003600
}
```

---

## Error Handling Flow

```
Error Occurs
    │
    ├─ Authentication Error
    │   ├─ Invalid credentials → Show error message
    │   ├─ Token expired → Auto logout & redirect to login
    │   └─ Invalid token → Clear storage & redirect to login
    │
    ├─ Authorization Error
    │   ├─ Missing PKCE verifier → Show error & redirect to login
    │   ├─ Invalid redirect_uri → Show error message
    │   └─ Invalid code → Show error & redirect to login
    │
    └─ Network Error
        ├─ Server unreachable → Show "Server unavailable" message
        └─ Timeout → Show "Request timeout" message
```

---

**Created:** 2025-12-30  
**Version:** 1.0
