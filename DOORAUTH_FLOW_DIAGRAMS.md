# DoorAuth Authentication Flows - Visual Guide

## Table of Contents
1. [System Architecture](#system-architecture)
2. [First-Time Login Flow](#first-time-login-flow)
3. [SSO Login Flow](#sso-login-flow)
4. [Token Exchange Flow](#token-exchange-flow)
5. [Logout Flow](#logout-flow)
6. [Multi-Application SSO](#multi-application-sso)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DoorAuth Ecosystem                            │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────┐
                    │   DoorAuth Server        │
                    │   (localhost:3000)       │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │  PostgreSQL DB     │  │
                    │  │  - Users           │  │
                    │  │  - Applications    │  │
                    │  │  - Tenants         │  │
                    │  │  - Tokens          │  │
                    │  └────────────────────┘  │
                    │                          │
                    │  OAuth 2.0 / OIDC        │
                    │  - /authorize            │
                    │  - /token                │
                    │  - /userinfo             │
                    │  - /end_session          │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
        ┌───────────▼──────────┐  ┌──────────▼──────────┐
        │  VehicleManagement   │  │   DoorAuthSample    │
        │  (localhost:7231)    │  │   (localhost:7140)  │
        │                      │  │                     │
        │  Blazor Server       │  │   ASP.NET Core      │
        │  .NET 9              │  │   Razor Pages       │
        └──────────────────────┘  └─────────────────────┘
                    │
        ┌───────────▼──────────┐
        │   Client Todo        │
        │   (localhost:5175)   │
        │                      │
        │   React SPA          │
        │   TypeScript         │
        └──────────────────────┘
```

---

## First-Time Login Flow

### Step-by-Step Sequence

```
┌─────────────┐                                    ┌──────────────┐
│   Browser   │                                    │ DoorAuth     │
│   (User)    │                                    │   Server     │
└──────┬──────┘                                    └──────┬───────┘
       │                                                  │
       │  1. Navigate to https://localhost:7231          │
       ├────────────────────────────────────────────────►│
       │                                                  │
       │  2. Not authenticated → Redirect to /login      │
       │◄────────────────────────────────────────────────┤
       │                                                  │
       │  3. User clicks "Sign In with DoorAuth"         │
       │                                                  │
       │  4. Redirect to /api/oauth/authorize            │
       │     ?client_id=vehicle-management-web           │
       │     &redirect_uri=https://localhost:7231/...    │
       │     &response_type=code                         │
       │     &scope=openid profile email                 │
       │     &code_challenge=...                         │
       ├────────────────────────────────────────────────►│
       │                                                  │
       │  5. Show Login Form                             │
       │◄────────────────────────────────────────────────┤
       │                                                  │
       │  6. User enters credentials                     │
       │     Email: bd@gmail.com                         │
       │     Password: 1q2w3E*                           │
       ├────────────────────────────────────────────────►│
       │                                                  │
       │                                    ┌─────────────┴──────────┐
       │                                    │ Validate Credentials   │
       │                                    │ Generate Auth Code     │
       │                                    │ Store PKCE Challenge   │
       │                                    └─────────────┬──────────┘
       │                                                  │
       │  7. Redirect to callback with code              │
       │     https://localhost:7231/signin-oidc          │
       │     ?code=AUTH_CODE_HERE                        │
       │◄────────────────────────────────────────────────┤
       │                                                  │
┌──────▼──────┐                                          │
│ VehicleMgmt │                                          │
│    App      │                                          │
└──────┬──────┘                                          │
       │                                                  │
       │  8. Exchange code for token                     │
       │     POST /api/oauth/token                       │
       │     {                                            │
       │       grant_type: "authorization_code",         │
       │       code: "AUTH_CODE_HERE",                   │
       │       client_id: "vehicle-management-web",      │
       │       client_secret: "...",                     │
       │       code_verifier: "..."                      │
       │     }                                            │
       ├────────────────────────────────────────────────►│
       │                                                  │
       │                                    ┌─────────────┴──────────┐
       │                                    │ Validate Code          │
       │                                    │ Verify PKCE            │
       │                                    │ Generate Access Token  │
       │                                    │ Generate ID Token      │
       │                                    └─────────────┬──────────┘
       │                                                  │
       │  9. Return tokens                               │
       │     {                                            │
       │       access_token: "eyJhbGc...",               │
       │       id_token: "eyJhbGc...",                   │
       │       token_type: "Bearer",                     │
       │       expires_in: 3600                          │
       │     }                                            │
       │◄────────────────────────────────────────────────┤
       │                                                  │
┌──────┴──────┐                                          │
│ Store Token │                                          │
│ in Cookie   │                                          │
└──────┬──────┘                                          │
       │                                                  │
       │  10. Redirect to dashboard                      │
       │      https://localhost:7231/                    │
       │                                                  │
       │  ✅ USER IS NOW AUTHENTICATED                   │
       │                                                  │
```

---

## SSO Login Flow

### When User Already Has Active Session

```
┌─────────────┐                                    ┌──────────────┐
│   Browser   │                                    │ DoorAuth     │
│   (User)    │                                    │   Server     │
└──────┬──────┘                                    └──────┬───────┘
       │                                                  │
       │  User already logged into DoorAuthSample        │
       │  (has jwt cookie for localhost:3000)            │
       │                                                  │
       │  1. Navigate to https://localhost:7231          │
       ├────────────────────────────────────────────────►│
       │                                                  │
       │  2. Not authenticated → Redirect to /login      │
       │                                                  │
       │  3. Redirect to /api/oauth/authorize            │
       │     (with jwt cookie automatically sent)        │
       ├────────────────────────────────────────────────►│
       │                                                  │
       │                                    ┌─────────────┴──────────┐
       │                                    │ Check jwt Cookie       │
       │                                    │ ✅ Valid Session Found │
       │                                    │ Generate Auth Code     │
       │                                    │ (NO LOGIN FORM!)       │
       │                                    └─────────────┬──────────┘
       │                                                  │
       │  4. Immediate redirect with code                │
       │     https://localhost:7231/signin-oidc          │
       │     ?code=AUTH_CODE_HERE                        │
       │◄────────────────────────────────────────────────┤
       │                                                  │
       │  5-8. Token exchange (same as first-time)       │
       │                                                  │
       │  ✅ USER AUTHENTICATED WITHOUT LOGIN FORM       │
       │     (This is SSO in action!)                    │
       │                                                  │
```

---

## Token Exchange Flow

### Detailed PKCE Flow

```
┌──────────────────┐                              ┌──────────────┐
│ VehicleManagement│                              │  DoorAuth    │
│      App         │                              │   Server     │
└────────┬─────────┘                              └──────┬───────┘
         │                                               │
         │  STEP 1: Generate PKCE Values                │
         │  ┌────────────────────────────┐              │
         │  │ code_verifier = random()   │              │
         │  │ code_challenge = SHA256(   │              │
         │  │   code_verifier            │              │
         │  │ )                          │              │
         │  └────────────────────────────┘              │
         │                                               │
         │  STEP 2: Authorization Request               │
         │  GET /api/oauth/authorize                    │
         │  ?response_type=code                         │
         │  &client_id=vehicle-management-web           │
         │  &redirect_uri=https://localhost:7231/...    │
         │  &scope=openid profile email                 │
         │  &code_challenge=CHALLENGE_HERE              │
         │  &code_challenge_method=S256                 │
         ├──────────────────────────────────────────────►│
         │                                               │
         │                                 ┌─────────────┴──────────┐
         │                                 │ Store code_challenge   │
         │                                 │ with authorization code│
         │                                 └─────────────┬──────────┘
         │                                               │
         │  STEP 3: Authorization Code                  │
         │  Redirect: ?code=AUTH_CODE                   │
         │◄──────────────────────────────────────────────┤
         │                                               │
         │  STEP 4: Token Request                       │
         │  POST /api/oauth/token                       │
         │  {                                            │
         │    grant_type: "authorization_code",         │
         │    code: "AUTH_CODE",                        │
         │    client_id: "vehicle-management-web",      │
         │    client_secret: "...",                     │
         │    redirect_uri: "https://localhost:7231/...",│
         │    code_verifier: "VERIFIER_HERE"            │
         │  }                                            │
         ├──────────────────────────────────────────────►│
         │                                               │
         │                                 ┌─────────────┴──────────┐
         │                                 │ Verify code_challenge: │
         │                                 │ SHA256(code_verifier)  │
         │                                 │ == stored_challenge    │
         │                                 │                        │
         │                                 │ ✅ PKCE Valid          │
         │                                 │ Generate Tokens        │
         │                                 └─────────────┬──────────┘
         │                                               │
         │  STEP 5: Access Token Response               │
         │  {                                            │
         │    access_token: "eyJhbGc...",               │
         │    id_token: "eyJhbGc...",                   │
         │    token_type: "Bearer",                     │
         │    expires_in: 3600,                         │
         │    refresh_token: "..."                      │
         │  }                                            │
         │◄──────────────────────────────────────────────┤
         │                                               │
         │  ✅ TOKENS RECEIVED                          │
         │                                               │
```

---

## Logout Flow

### Single Sign-Out Across All Applications

```
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Browser   │  │ VehicleMgmt  │  │  DoorAuth    │  │ DoorAuthSample│
│   (User)    │  │     App      │  │   Server     │  │     App       │
└──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘
       │                │                  │                 │
       │  1. User clicks "Logout"         │                 │
       ├───────────────►│                  │                 │
       │                │                  │                 │
       │                │  2. SignOutAsync │                 │
       │                │     (Cookies)    │                 │
       │                │                  │                 │
       │                │  3. SignOutAsync │                 │
       │                │     (OIDC)       │                 │
       │                │                  │                 │
       │  4. Redirect to end_session      │                 │
       │  https://localhost:3000/         │                 │
       │  api/oauth/end_session           │                 │
       │  ?post_logout_redirect_uri=...   │                 │
       ├─────────────────────────────────►│                 │
       │                │                  │                 │
       │                │    ┌─────────────┴──────────┐     │
       │                │    │ Clear ALL Cookies:     │     │
       │                │    │ - jwt                  │     │
       │                │    │ - access_token         │     │
       │                │    │ - connect.sid          │     │
       │                │    └─────────────┬──────────┘     │
       │                │                  │                 │
       │  5. Redirect to app              │                 │
       │  https://localhost:7231/         │                 │
       │◄─────────────────────────────────┤                 │
       │                │                  │                 │
       │  ✅ Logged out from VehicleMgmt  │                 │
       │                │                  │                 │
       │  6. Try to access DoorAuthSample │                 │
       ├────────────────────────────────────────────────────►│
       │                │                  │                 │
       │                │                  │  7. Check auth  │
       │                │                  │  (jwt cookie)   │
       │                │                  │◄────────────────┤
       │                │                  │                 │
       │                │    ┌─────────────┴──────────┐     │
       │                │    │ ❌ No jwt Cookie       │     │
       │                │    │ Session Terminated     │     │
       │                │    └─────────────┬──────────┘     │
       │                │                  │                 │
       │  8. Redirect to login            │                 │
       │◄─────────────────────────────────┼─────────────────┤
       │                │                  │                 │
       │  ✅ MUST LOGIN AGAIN             │                 │
       │  (Single Sign-Out successful!)   │                 │
       │                │                  │                 │
```

---

## Multi-Application SSO

### How SSO Works Across Multiple Apps

```
┌────────────────────────────────────────────────────────────────┐
│                    SSO Session Management                       │
└────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   DoorAuth Server    │
                    │   (localhost:3000)   │
                    │                      │
                    │  Session Storage:    │
                    │  ┌────────────────┐  │
                    │  │ User: bd@...   │  │
                    │  │ jwt: eyJhbG... │  │
                    │  │ Expires: 1h    │  │
                    │  └────────────────┘  │
                    └──────────┬───────────┘
                               │
                               │ jwt Cookie
                               │ (Shared across apps)
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐   ┌─────────▼────────┐   ┌────────▼────────┐
│ VehicleMgmt    │   │ DoorAuthSample   │   │ Client Todo     │
│ localhost:7231 │   │ localhost:7140   │   │ localhost:5175  │
│                │   │                  │   │                 │
│ App Cookie:    │   │ App Cookie:      │   │ localStorage:   │
│ .AspNetCore... │   │ .AspNetCore...   │   │ access_token    │
└────────────────┘   └──────────────────┘   └─────────────────┘

LOGIN FLOW:
1. User logs into VehicleMgmt
   → DoorAuth sets jwt cookie (domain: localhost:3000)
   → VehicleMgmt sets app cookie (domain: localhost:7231)

2. User visits DoorAuthSample
   → Browser sends jwt cookie to DoorAuth
   → DoorAuth sees valid session
   → Auto-generates auth code
   → DoorAuthSample gets token
   → ✅ SSO Login (no credentials needed!)

3. User visits Client Todo
   → Browser sends jwt cookie to DoorAuth
   → DoorAuth sees valid session
   → Auto-generates auth code
   → Client Todo gets token
   → ✅ SSO Login (no credentials needed!)

LOGOUT FLOW:
1. User logs out from ANY app
   → Redirects to DoorAuth end_session
   → DoorAuth clears jwt cookie
   → ❌ SSO session terminated

2. Try to access ANY app
   → No jwt cookie sent to DoorAuth
   → DoorAuth requires login
   → ✅ Single Sign-Out working!
```

---

## Cookie Management

### Understanding Cookie Domains and Ports

```
┌────────────────────────────────────────────────────────────────┐
│                    Cookie Isolation                             │
└────────────────────────────────────────────────────────────────┘

Browser Cookie Jars (Separate by Origin):

┌─────────────────────────────────────┐
│  localhost:3000 (DoorAuth)          │
│  ┌───────────────────────────────┐  │
│  │ jwt: eyJhbGc...               │  │ ← SSO Session Cookie
│  │ access_token: eyJhbGc...      │  │ ← React Frontend
│  │ connect.sid: s%3A...          │  │ ← Express Session
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  localhost:7231 (VehicleMgmt)       │
│  ┌───────────────────────────────┐  │
│  │ .AspNetCore.Cookies: CfDJ8... │  │ ← App Session
│  │ .AspNetCore.Correlation: ...  │  │ ← OIDC Correlation
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  localhost:7140 (DoorAuthSample)    │
│  ┌───────────────────────────────┐  │
│  │ .AspNetCore.Cookies: CfDJ8... │  │ ← App Session
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  localhost:5175 (Client Todo)       │
│  ┌───────────────────────────────┐  │
│  │ (No cookies - uses localStorage)│  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

KEY POINTS:
✅ jwt cookie is SHARED across all apps (sent to localhost:3000)
✅ App cookies are ISOLATED (each app has its own)
✅ Logout clears jwt → All apps lose SSO session
✅ Logout from one app → Must re-login to all apps
```

---

## Security Features

### PKCE (Proof Key for Code Exchange)

```
┌────────────────────────────────────────────────────────────────┐
│                    PKCE Security Flow                           │
└────────────────────────────────────────────────────────────────┘

CLIENT SIDE:
1. Generate random code_verifier
   code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"

2. Create code_challenge
   code_challenge = BASE64URL(SHA256(code_verifier))
                  = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"

3. Send code_challenge in authorization request
   /authorize?code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
             &code_challenge_method=S256

SERVER SIDE:
4. Store code_challenge with authorization code

5. Client exchanges code for token, sends code_verifier
   /token?code=AUTH_CODE&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

6. Server verifies:
   SHA256(code_verifier) == stored_code_challenge
   ✅ If match → Issue tokens
   ❌ If no match → Reject

SECURITY BENEFIT:
Even if authorization code is intercepted, attacker cannot
exchange it for tokens without the original code_verifier!
```

---

## Summary

### Key Takeaways

1. **SSO Login**: Users log in once, access all apps
2. **PKCE Security**: Enhanced security for public clients
3. **Token-Based Auth**: Stateless, scalable authentication
4. **Single Sign-Out**: Logout from one app logs out from all
5. **Cookie Isolation**: Each app has separate cookies, but shares SSO session

### Authentication Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/oauth/authorize` | GET | Start OAuth flow |
| `/api/oauth/token` | POST | Exchange code for token |
| `/api/oauth/userinfo` | GET | Get user information |
| `/api/oauth/end_session` | GET | Logout (SSO) |
| `/.well-known/openid-configuration` | GET | OIDC discovery |
| `/.well-known/jwks.json` | GET | Public keys |

### Application Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/login` | Trigger authentication |
| `/logout` | Trigger logout |
| `/signin-oidc` | OAuth callback (automatic) |
| `/signout-callback-oidc` | Logout callback (automatic) |

---

**For detailed implementation, see `DOORAUTH_INTEGRATION_GUIDE.md`**
