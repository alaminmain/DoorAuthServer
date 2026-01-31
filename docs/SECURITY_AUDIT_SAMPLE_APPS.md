# Security Audit: Sample Applications

**Date:** 2026-01-30
**Auditor Role:** Senior Developer & Security Manager
**Scope:** DoorAuthSample (ASP.NET), client_todo (React SPA), docs-site

---

## Executive Summary

| Application | Risk Level | Critical Issues | Production Ready |
|-------------|------------|-----------------|------------------|
| **DoorAuthSample** | 🔴 CRITICAL | 6 | ❌ NO |
| **client_todo** | 🔴 CRITICAL | 3 | ❌ NO |
| **docs-site** | 🟢 LOW | 0 | ✅ YES (static docs) |

**Verdict:** Both sample applications contain **CRITICAL security vulnerabilities** that make them unsuitable for production use. They serve as development/demo examples only and require significant hardening before production deployment.

---

## Application 1: DoorAuthSample (ASP.NET Core)

### Overview
- **Purpose:** Dashboard application demonstrating OIDC integration
- **Framework:** ASP.NET Core with OpenID Connect
- **Location:** `/DoorAuthSample/`

### Critical Vulnerabilities (Must Fix)

#### 1. Disabled Token Validation ❌
**Location:** `Program.cs` Lines 60-63
```csharp
ValidateIssuer = false,        // DANGEROUS
ValidateAudience = false,      // DANGEROUS
SignatureValidator = (token, parameters) =>
    new JsonWebToken(token)    // BYPASSES SIGNATURE VERIFICATION
```
**Impact:** Accepts tokens from ANY source. Attackers can forge valid-looking tokens.
**Fix:** Enable issuer/audience validation with proper values.

#### 2. Disabled CSRF Protection ❌
**Location:** `Program.cs` Lines 66-71
```csharp
RequireNonce = false,
RequireState = false,
RequireStateValidation = false
```
**Impact:** Vulnerable to:
- Cross-Site Request Forgery (CSRF) attacks
- Authorization code injection
- Session fixation attacks

**Fix:** Enable all three validations.

#### 3. Dangerous Certificate Bypass ❌
**Location:** `Program.cs` Lines 74-76
```csharp
ServerCertificateCustomValidationCallback =
    HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
```
**Impact:** Man-in-the-Middle (MITM) attacks possible.
**Fix:** Use proper development certificates or configure trusted CA.

#### 4. Hardcoded Client Secret ❌
**Location:** `Program.cs` Line 26
```csharp
options.ClientSecret = "sample-secret-key";
```
**Impact:** Secret exposed in source code.
**Fix:** Use Azure Key Vault, User Secrets, or environment variables.

#### 5. Access Token Exposed in DOM ❌
**Location:** `Index.cshtml` Lines 73, 95
```html
<input type="hidden" id="accessToken" value="@Model.AccessToken" />
```
```javascript
const ssoUrl = `${cleanAppUrl}/sso?token=${encodeURIComponent(token)}`;
```
**Impact:**
- XSS can steal tokens from DOM
- Tokens visible in URL (browser history, logs, Referer headers)

**Fix:** Use HTTP-only cookies or server-side sessions.

#### 6. No Authorization Attribute ❌
**Location:** `Index.cshtml.cs`
**Issue:** Protected pages lack `[Authorize]` attribute.
**Impact:** Pages accessible without authentication.
**Fix:** Add `[Authorize]` to protected PageModels.

### High Severity Issues

| Issue | Location | Fix |
|-------|----------|-----|
| RequireHttpsMetadata = false | Program.cs:40 | Set to `true` in production |
| SameSite=None for cookies | Program.cs:16,79-81 | Use `SameSiteMode.Strict` |
| GET-based logout (CSRF risk) | Program.cs:144 | Change to POST with anti-forgery |
| No session timeout | N/A | Configure explicit timeout |

### Positive Security Aspects ✅
- PKCE enabled
- HTTPS redirection configured
- HSTS in production
- Cookies marked Secure/HttpOnly by default
- Proper middleware ordering

---

## Application 2: client_todo (React SPA)

### Overview
- **Purpose:** Todo application demonstrating OAuth 2.0 PKCE flow
- **Framework:** React + TypeScript + Vite
- **Location:** `/client_todo/`

### Critical Vulnerabilities (Must Fix)

#### 1. Missing State Parameter ❌
**Location:** `AuthService.ts` Lines 34-41, `Callback.tsx`
```typescript
// No state parameter in authorization request
const params = new URLSearchParams({
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    // state: ??? MISSING
});
```
**Impact:** CSRF vulnerability - attackers can initiate authorization without user knowledge.
**Fix:** Generate random state, store in sessionStorage, validate on callback.

#### 2. Client Secret in Frontend Code ❌
**Location:** `AuthService.ts` Line 52
```typescript
client_secret: 'todo-secret-key',  // EXPOSED IN BROWSER
```
**Impact:** Anyone can view source and impersonate the application.
**Fix:**
- Remove client secret from frontend entirely
- Use backend proxy for token exchange, OR
- Configure DoorAuth to not require secret for public clients

#### 3. Weak PKCE Verifier Generation ❌
**Location:** `AuthService.ts` Lines 15-19
```typescript
generateCodeVerifier() {
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    // ^^ substr(-2) REDUCES entropy significantly
}
```
**Impact:** Weakened PKCE protection due to reduced entropy.
**Fix:** Proper Base64URL encoding of 32+ random bytes.

### High Severity Issues

| Issue | Location | Fix |
|-------|----------|-----|
| localStorage token storage (XSS) | AuthService.ts:61 | Use HTTP-only cookies |
| No token refresh mechanism | Full codebase | Implement refresh flow |
| Hardcoded localhost URLs | Multiple files | Use environment variables |
| JWT decoded without signature check | AuthProvider.tsx:39 | Validate on server |

### Positive Security Aspects ✅
- PKCE implemented (S256 method)
- Proper Base64URL encoding for challenge
- Cross-tab logout synchronization
- Token expiry checking
- Code verifier cleanup after use

---

## Application 3: docs-site

### Overview
- **Purpose:** Static documentation website
- **Framework:** HTML/CSS/JavaScript (no auth)
- **Location:** `/docs-site/`

### Security Assessment
**Status:** ✅ LOW RISK

This is a static documentation site that does NOT implement authentication. It documents how to integrate with DoorAuth.

**Concerns:**
- Documentation shows code examples with hardcoded secrets (expected for docs)
- No actual authentication flow implemented

---

## Cross-Application Flow Analysis

### OAuth/OIDC Flow Verification

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   client_todo   │     │  DoorAuth Server│     │ DoorAuthSample  │
│   (React SPA)   │     │   (localhost:   │     │  (ASP.NET Core) │
│   Port: 5175    │     │      3000)      │     │  Port: 7140     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. /authorize         │                       │
         │ (PKCE challenge)      │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 2. Login Page         │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 3. Credentials        │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 4. Auth Code          │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │ 5. /token             │                       │
         │ (code + verifier)     │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │ 6. Access Token       │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │                       │                       │
         │                       │ 7. /authorize (OIDC)  │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │ 8. Auth Code          │
         │                       │──────────────────────>│
         │                       │                       │
         │                       │ 9. /token             │
         │                       │<──────────────────────│
         │                       │                       │
         │                       │ 10. ID + Access Token │
         │                       │──────────────────────>│
```

### Flow Issues Identified

| Step | Issue | Application | Severity |
|------|-------|-------------|----------|
| 1 | Missing state parameter | client_todo | CRITICAL |
| 5 | Client secret exposed | client_todo | CRITICAL |
| 5 | Weak PKCE verifier | client_todo | HIGH |
| 7-10 | Token validation disabled | DoorAuthSample | CRITICAL |
| 7-10 | State/nonce disabled | DoorAuthSample | CRITICAL |
| 6,10 | Tokens stored insecurely | Both | HIGH |

---

## SSO Logout Flow Analysis

### Expected Flow
```
1. User clicks logout in App A
2. App A clears local session
3. App A redirects to /api/oauth/end_session
4. DoorAuth clears auth cookies
5. DoorAuth redirects to post_logout_redirect_uri
6. Other apps (App B, C) detect logout via:
   - Front-channel logout (iframes)
   - Back-channel logout (server notifications)
   - Session polling
```

### Current Implementation

**client_todo:**
```typescript
const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    localStorage.setItem('logout-event', Date.now().toString()); // Cross-tab
    window.location.href = 'https://localhost:3000/api/oauth/end_session?...';
};
```
✅ Cross-tab logout implemented
✅ Server logout endpoint called
⚠️ No error handling
⚠️ Hardcoded URL

**DoorAuthSample:**
```csharp
app.MapGet("/logout", async (context) => {
    await context.SignOutAsync("Cookies");
    await context.SignOutAsync("oidc", new AuthenticationProperties {
        RedirectUri = "/"
    });
});
```
✅ Signs out from both local and OIDC
⚠️ GET-based (CSRF vulnerable)
⚠️ No logout confirmation

---

## Security Remediation Priority Matrix

### Immediate (Before Any Testing)

| # | Fix | Application | Effort |
|---|-----|-------------|--------|
| 1 | Enable token validation | DoorAuthSample | 1 hour |
| 2 | Enable state/nonce validation | DoorAuthSample | 30 min |
| 3 | Add state parameter | client_todo | 2 hours |
| 4 | Remove client secret from frontend | client_todo | 1 hour |
| 5 | Fix PKCE verifier generation | client_todo | 1 hour |

### Before Production

| # | Fix | Application | Effort |
|---|-----|-------------|--------|
| 6 | Use proper certificates | DoorAuthSample | 1 hour |
| 7 | Move secrets to Key Vault | DoorAuthSample | 2 hours |
| 8 | Implement token refresh | client_todo | 4 hours |
| 9 | Use HTTP-only cookies | Both | 8 hours |
| 10 | Add [Authorize] attributes | DoorAuthSample | 30 min |
| 11 | Change logout to POST | DoorAuthSample | 1 hour |
| 12 | Environment configuration | Both | 2 hours |

### Best Practices (Medium Term)

| # | Fix | Application | Effort |
|---|-----|-------------|--------|
| 13 | Add CSP headers | Both | 2 hours |
| 14 | Implement rate limiting | Server | 4 hours |
| 15 | Add audit logging | Both | 4 hours |
| 16 | Token expiry interceptors | client_todo | 2 hours |

---

## Recommended Secure Configuration

### DoorAuthSample - Secure Program.cs
```csharp
.AddOpenIdConnect("oidc", options =>
{
    options.Authority = Environment.GetEnvironmentVariable("OIDC_AUTHORITY");
    options.ClientId = Environment.GetEnvironmentVariable("OIDC_CLIENT_ID");
    options.ClientSecret = Environment.GetEnvironmentVariable("OIDC_CLIENT_SECRET");

    options.RequireHttpsMetadata = true;  // ENFORCE HTTPS

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,            // ENABLE
        ValidateAudience = true,          // ENABLE
        ValidIssuer = options.Authority,
        ValidAudience = options.ClientId,
        // Remove custom SignatureValidator - use default
    };

    // ENABLE CSRF PROTECTION
    // (Don't set RequireNonce/RequireState to false)

    options.Cookie.SameSite = SameSiteMode.Strict;  // Use Strict
});
```

### client_todo - Secure AuthService.ts
```typescript
async login() {
    const { challenge, verifier } = await this.generatePKCE();
    const state = this.generateState();

    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.scope,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: state  // ADD STATE PARAMETER
    });

    window.location.href = `${config.authority}/api/oauth/authorize?${params}`;
}

async handleCallback(code: string, returnedState: string) {
    const savedState = sessionStorage.getItem('oauth_state');
    if (returnedState !== savedState) {
        throw new Error('State mismatch - possible CSRF attack');
    }

    // Token exchange via backend proxy (no client_secret in frontend)
    const response = await axios.post('/api/auth/callback', { code });
    // Backend handles token exchange with client_secret
}

generateCodeVerifier(): string {
    const array = new Uint8Array(32);  // 256 bits
    window.crypto.getRandomValues(array);
    return this.base64URLEncode(array);
}

generateState(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return this.base64URLEncode(array);
}

base64URLEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
```

---

## Testing Checklist

### Security Test Cases

- [ ] **CSRF Protection**
  - [ ] State parameter mismatch rejected
  - [ ] Nonce validation working
  - [ ] Logout requires POST (ASP.NET)

- [ ] **Token Validation**
  - [ ] Invalid issuer rejected
  - [ ] Invalid audience rejected
  - [ ] Expired tokens rejected
  - [ ] Tampered tokens rejected

- [ ] **PKCE**
  - [ ] Wrong code_verifier rejected
  - [ ] Missing code_verifier rejected
  - [ ] Replay attack blocked

- [ ] **XSS Protection**
  - [ ] Tokens not accessible via DOM
  - [ ] CSP headers present

- [ ] **Session Management**
  - [ ] Cross-tab logout works
  - [ ] Server session invalidated on logout
  - [ ] Token refresh works

- [ ] **HTTPS**
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header present
  - [ ] Secure cookie flag set

---

## Conclusion

### Summary

Both sample applications demonstrate the **correct OAuth/OIDC flow architecture** but have **critical implementation shortcuts** unsuitable for production:

| Application | Architecture | Implementation | Security |
|-------------|--------------|----------------|----------|
| DoorAuthSample | ✅ Good | ⚠️ Dev shortcuts | ❌ Critical flaws |
| client_todo | ✅ Good | ⚠️ Missing features | ❌ Critical flaws |

### Recommendation

1. **Do NOT use these samples in production** without security hardening
2. Treat them as **educational examples** of OAuth/OIDC flow
3. Apply all **Immediate** fixes before any external testing
4. Apply all **Before Production** fixes before deployment
5. Consider creating a **hardened template** from these samples

### Estimated Remediation Effort

| Priority | Total Effort |
|----------|--------------|
| Immediate | ~6 hours |
| Before Production | ~20 hours |
| Best Practices | ~12 hours |
| **Total** | **~38 hours** |

---

**Document prepared by:** Claude (Security Audit Role)
**Review status:** Pending human security review
