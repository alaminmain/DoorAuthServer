# Security Implementation TODO

**Created:** 2026-01-30
**Priority:** IMMEDIATE
**Status:** 🔴 CRITICAL - Must complete before any external testing

---

## Priority Legend

- 🔴 **CRITICAL** - Security vulnerability, must fix immediately
- 🟠 **HIGH** - Important security concern, fix before testing
- 🟡 **MEDIUM** - Should fix before production
- 🔵 **LOW** - Best practice, fix when possible

---

## Phase 1: CRITICAL FIXES (Immediate)

### 1.1 client_todo - Add State Parameter (CSRF Protection)

**File:** `client_todo/src/services/AuthService.ts`
**Risk:** 🔴 CRITICAL - CSRF vulnerability

**Current Code (Lines 32-42):**
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
        // ❌ MISSING: state parameter
    });
}
```

**Required Fix:**
```typescript
async login() {
    const { challenge } = await this.generatePKCE();
    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
        client_id: authConfig.clientId,
        redirect_uri: authConfig.redirectUri,
        response_type: authConfig.responseType,
        scope: authConfig.scope,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: state  // ✅ ADD THIS
    });
}

generateState(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
```

**Also update:** `client_todo/src/pages/Callback.tsx`
```typescript
const code = searchParams.get('code');
const returnedState = searchParams.get('state');
const savedState = sessionStorage.getItem('oauth_state');

if (returnedState !== savedState) {
    setError('State mismatch - possible CSRF attack');
    return;
}
```

- [ ] Add `generateState()` method
- [ ] Store state in sessionStorage
- [ ] Add state to authorization URL
- [ ] Validate state in Callback.tsx
- [ ] Clear state after validation

---

### 1.2 client_todo - Remove Client Secret from Frontend

**File:** `client_todo/src/services/AuthService.ts`
**Risk:** 🔴 CRITICAL - Secret exposed in browser

**Current Code (Line 52):**
```typescript
const response = await axios.post(`${authConfig.authority}/api/oauth/token`, {
    grant_type: 'authorization_code',
    client_id: authConfig.clientId,
    client_secret: 'todo-secret-key',  // ❌ EXPOSED SECRET
    code,
    redirect_uri: authConfig.redirectUri,
    code_verifier: verifier
});
```

**Required Fix - Option A (Recommended):** Configure DoorAuth server to allow public clients without secret

**Server change** (`server/src/controllers/oauth.controller.ts`):
```typescript
// For public clients (SPAs), don't require client_secret if PKCE is used
if (!client_secret && code_verifier) {
    // Allow - PKCE provides security for public clients
}
```

**Required Fix - Option B:** Create backend proxy for token exchange

- [ ] Update DoorAuth server to support public clients with PKCE
- [ ] OR create backend proxy endpoint
- [ ] Remove client_secret from frontend code
- [ ] Test token exchange still works

---

### 1.3 client_todo - Fix Weak PKCE Verifier

**File:** `client_todo/src/services/AuthService.ts`
**Risk:** 🔴 CRITICAL - Reduced security entropy

**Current Code (Lines 15-19):**
```typescript
generateCodeVerifier() {
    const array = new Uint32Array(56 / 2);  // Only 28 integers
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    // ❌ substr(-2) loses most of each number's entropy
}
```

**Required Fix:**
```typescript
generateCodeVerifier(): string {
    const array = new Uint8Array(32);  // 256 bits of entropy
    window.crypto.getRandomValues(array);
    return this.base64URLEncode(array);
}

base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
```

- [ ] Replace `generateCodeVerifier()` method
- [ ] Add `base64URLEncode()` helper
- [ ] Test PKCE flow still works
- [ ] Verify verifier length is 43+ characters

---

### 1.4 DoorAuthSample - Enable Token Validation

**File:** `DoorAuthSample/Program.cs`
**Risk:** 🔴 CRITICAL - Accepts forged tokens

**Current Code (Lines 56-63):**
```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    NameClaimType = "name",
    RoleClaimType = "role",
    ValidateIssuer = false,  // ❌ DISABLED
    ValidateAudience = false,  // ❌ DISABLED
    SignatureValidator = (token, parameters) =>
        new JsonWebToken(token)  // ❌ BYPASSES SIGNATURE
};
```

**Required Fix:**
```csharp
options.TokenValidationParameters = new TokenValidationParameters
{
    NameClaimType = "name",
    RoleClaimType = "role",
    ValidateIssuer = true,  // ✅ ENABLE
    ValidIssuer = "https://localhost:3000",
    ValidateAudience = true,  // ✅ ENABLE
    ValidAudience = "door-auth-sample",
    ValidateLifetime = true,
    // REMOVE SignatureValidator - use default JWKS validation
};
```

- [ ] Set `ValidateIssuer = true`
- [ ] Set `ValidIssuer` to DoorAuth URL
- [ ] Set `ValidateAudience = true`
- [ ] Set `ValidAudience` to client ID
- [ ] Remove custom `SignatureValidator`
- [ ] Test authentication still works

---

### 1.5 DoorAuthSample - Enable CSRF Protection

**File:** `DoorAuthSample/Program.cs`
**Risk:** 🔴 CRITICAL - CSRF/replay attacks possible

**Current Code (Lines 66-71):**
```csharp
options.ProtocolValidator = new OpenIdConnectProtocolValidator
{
    RequireNonce = false,  // ❌ DISABLED
    RequireState = false,  // ❌ DISABLED
    RequireStateValidation = false  // ❌ DISABLED
};
```

**Required Fix:**
```csharp
// REMOVE this entire block - use defaults
// options.ProtocolValidator = ... DELETE THIS
```

Or explicitly enable:
```csharp
options.ProtocolValidator = new OpenIdConnectProtocolValidator
{
    RequireNonce = true,  // ✅ ENABLE
    RequireState = true,  // ✅ ENABLE
    RequireStateValidation = true  // ✅ ENABLE
};
```

- [ ] Remove or update `ProtocolValidator` configuration
- [ ] Ensure nonce validation is enabled
- [ ] Ensure state validation is enabled
- [ ] Test login flow still works

---

### 1.6 DoorAuthSample - Fix Certificate Validation

**File:** `DoorAuthSample/Program.cs`
**Risk:** 🔴 CRITICAL - MITM attacks possible

**Current Code (Lines 73-76):**
```csharp
var httpClientHandler = new HttpClientHandler();
httpClientHandler.ServerCertificateCustomValidationCallback =
    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;  // ❌ DANGEROUS
options.BackchannelHttpHandler = httpClientHandler;
```

**Required Fix - Development:**
```csharp
// Use proper development certificate
// Run: dotnet dev-certs https --trust
// Then REMOVE the custom handler entirely
```

**Required Fix - Production:**
```csharp
// REMOVE these lines entirely - use system certificate validation
// var httpClientHandler = new HttpClientHandler();
// httpClientHandler.ServerCertificateCustomValidationCallback = ...
// options.BackchannelHttpHandler = httpClientHandler;
```

- [ ] Generate proper dev certificate: `dotnet dev-certs https --trust`
- [ ] Remove `DangerousAcceptAnyServerCertificateValidator`
- [ ] Test backchannel communication works
- [ ] OR configure trusted CA for localhost

---

## Phase 2: HIGH PRIORITY FIXES

### 2.1 Move Secrets to Configuration

**Files:**
- `DoorAuthSample/Program.cs` (Line 26)
- `client_todo/src/services/AuthService.ts` (Line 52)

**Risk:** 🟠 HIGH - Secrets in source code

**DoorAuthSample Fix:**
```csharp
// appsettings.json (DO NOT COMMIT)
{
  "Oidc": {
    "ClientId": "door-auth-sample",
    "ClientSecret": "your-secret-here"
  }
}

// Program.cs
options.ClientId = builder.Configuration["Oidc:ClientId"];
options.ClientSecret = builder.Configuration["Oidc:ClientSecret"];
```

- [ ] Create `appsettings.Development.json` for secrets
- [ ] Add to `.gitignore`
- [ ] Update Program.cs to read from config
- [ ] Document secret setup in README

---

### 2.2 Use HTTP-Only Cookies for Tokens

**File:** `client_todo/src/services/AuthService.ts`
**Risk:** 🟠 HIGH - XSS can steal tokens from localStorage

**Current:** Tokens stored in localStorage (accessible to JavaScript)

**Required:** Server-side session or HTTP-only cookies

- [ ] Update DoorAuth server to set tokens in HTTP-only cookies
- [ ] Update client to not store tokens in localStorage
- [ ] Use credentials: 'include' for API requests
- [ ] Test authentication flow works

---

### 2.3 Implement Token Refresh

**File:** `client_todo/src/services/AuthService.ts`
**Risk:** 🟠 HIGH - No session persistence

**Required Fix:**
```typescript
async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await axios.post(`${authConfig.authority}/api/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: authConfig.clientId
    });

    // Store new tokens
    localStorage.setItem('access_token', response.data.access_token);
    if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
    }
}
```

- [ ] Add `refreshToken()` method
- [ ] Store refresh token from initial auth
- [ ] Add auto-refresh before token expiry
- [ ] Add axios interceptor for 401 handling

---

### 2.4 Change Logout to POST

**File:** `DoorAuthSample/Program.cs`
**Risk:** 🟠 HIGH - CSRF on logout

**Current Code (Lines 144-153):**
```csharp
app.MapGet("/logout", async (HttpContext context) => ...);  // ❌ GET
```

**Required Fix:**
```csharp
app.MapPost("/logout", async (HttpContext context) =>  // ✅ POST
{
    await context.SignOutAsync("Cookies");
    await context.SignOutAsync("oidc", new AuthenticationProperties
    {
        RedirectUri = "/"
    });
}).RequireAntiforgery();  // Add CSRF protection
```

- [ ] Change `/logout` from GET to POST
- [ ] Add anti-forgery token validation
- [ ] Update logout button/link to use form POST

---

### 2.5 Add [Authorize] Attribute

**File:** `DoorAuthSample/Pages/Index.cshtml.cs`
**Risk:** 🟠 HIGH - Protected pages accessible without auth

**Required Fix:**
```csharp
[Authorize]  // ✅ ADD THIS
public class IndexModel : PageModel
{
    // ...
}
```

- [ ] Add `[Authorize]` to `IndexModel`
- [ ] Add `[Authorize]` to other protected pages
- [ ] Test unauthorized access is blocked

---

## Phase 3: MEDIUM PRIORITY

### 3.1 Environment Configuration

**Files:** Multiple
**Risk:** 🟡 MEDIUM - Hardcoded URLs

- [ ] Create `.env` files for client_todo
- [ ] Use `import.meta.env` in Vite
- [ ] Create environment-specific appsettings for DoorAuthSample
- [ ] Document configuration for different environments

---

### 3.2 Add Security Headers

**Risk:** 🟡 MEDIUM - Missing browser protections

**Required Headers:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

- [ ] Configure headers in DoorAuth server
- [ ] Configure headers in Vite for client_todo
- [ ] Test headers are present in responses

---

### 3.3 Add Rate Limiting

**File:** `server/src/middlewares/rateLimiter.ts`
**Risk:** 🟡 MEDIUM - Brute force possible

- [ ] Verify rate limiting is applied to OAuth endpoints
- [ ] Add rate limiting to token endpoint
- [ ] Configure appropriate limits
- [ ] Test rate limiting works

---

## Phase 4: TESTING

### Security Test Checklist

After implementing fixes, verify:

- [ ] **State Parameter**
  - [ ] Login with modified state fails
  - [ ] Login with missing state fails
  - [ ] Login with valid state succeeds

- [ ] **Token Validation**
  - [ ] Forged token is rejected
  - [ ] Expired token is rejected
  - [ ] Valid token is accepted

- [ ] **PKCE**
  - [ ] Wrong verifier is rejected
  - [ ] Missing verifier is rejected
  - [ ] Correct verifier succeeds

- [ ] **CSRF Protection**
  - [ ] Logout via GET fails (if changed to POST)
  - [ ] Cross-site requests are blocked

- [ ] **Token Storage**
  - [ ] Tokens not accessible via JavaScript (if using HTTP-only)
  - [ ] XSS cannot steal tokens

---

## Implementation Tracking

| Task | Priority | Status | Assignee | Completed |
|------|----------|--------|----------|-----------|
| 1.1 Add state parameter | 🔴 CRITICAL | ⬜ TODO | | |
| 1.2 Remove client secret | 🔴 CRITICAL | ⬜ TODO | | |
| 1.3 Fix PKCE verifier | 🔴 CRITICAL | ⬜ TODO | | |
| 1.4 Enable token validation | 🔴 CRITICAL | ⬜ TODO | | |
| 1.5 Enable CSRF protection | 🔴 CRITICAL | ⬜ TODO | | |
| 1.6 Fix certificate validation | 🔴 CRITICAL | ⬜ TODO | | |
| 2.1 Move secrets to config | 🟠 HIGH | ⬜ TODO | | |
| 2.2 HTTP-only cookies | 🟠 HIGH | ⬜ TODO | | |
| 2.3 Token refresh | 🟠 HIGH | ⬜ TODO | | |
| 2.4 POST logout | 🟠 HIGH | ⬜ TODO | | |
| 2.5 Authorize attribute | 🟠 HIGH | ⬜ TODO | | |
| 3.1 Environment config | 🟡 MEDIUM | ⬜ TODO | | |
| 3.2 Security headers | 🟡 MEDIUM | ⬜ TODO | | |
| 3.3 Rate limiting | 🟡 MEDIUM | ⬜ TODO | | |

---

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 (Critical) | 6 tasks | 4-6 hours |
| Phase 2 (High) | 5 tasks | 6-8 hours |
| Phase 3 (Medium) | 3 tasks | 3-4 hours |
| Phase 4 (Testing) | Verification | 2-3 hours |
| **Total** | **14 tasks** | **15-21 hours** |

---

## Sign-Off

- [ ] All Phase 1 tasks completed
- [ ] All Phase 2 tasks completed
- [ ] Security tests passed
- [ ] Code reviewed by security team
- [ ] Ready for external testing

**Completed By:** _________________ **Date:** _________

**Reviewed By:** _________________ **Date:** _________
