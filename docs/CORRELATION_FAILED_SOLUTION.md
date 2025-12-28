# DoorAuth Integration - Correlation Failed Issue

## Current Status: ❌ NOT WORKING

### Problem Summary
The Vehicle Management System cannot authenticate with DoorAuth due to a **"Correlation failed"** error. This is caused by a fundamental incompatibility between:
- **Application**: Running on `HTTPS` (localhost:7231)
- **DoorAuth**: Running on `HTTP` (localhost:3000/5173)

### Root Cause
The ASP.NET Core OpenID Connect middleware sets correlation cookies when initiating authentication. These cookies MUST be present when DoorAuth redirects back to the application. However, browsers block or strip these cookies due to:

1. **Cross-scheme security**: HTTPS → HTTP → HTTPS transitions
2. **SameSite cookie policies**: Even with `SameSite=None`, browsers enforce strict security for mixed-protocol scenarios
3. **Secure cookie requirements**: Cookies set by HTTPS cannot be reliably sent back from HTTP redirects

### What We Tried (All Failed)
1. ✗ Setting `SameSiteMode.None` on cookies
2. ✗ Setting `CookieSecurePolicy.Always`
3. ✗ Disabling state validation (`RequireStateValidation = false`)
4. ✗ Disabling telemetry (`DisableTelemetry = true`)
5. ✗ Custom `OnMessageReceived` handler to bypass correlation
6. ✗ Allowing anonymous access to error page

**None of these work** because the correlation check happens deep in the OIDC middleware before any custom handlers can intercept it.

### Evidence from Logs

**DoorAuth Server (Working Perfectly ✅)**:
```
[INFO] [OIDC] Token request received
[INFO] [OIDC] Processing authorization_code grant
[INFO] Tokens generated successfully {
  has_access_token: true,
  has_refresh_token: true,
  has_id_token: true
}
```

**VehicleManagement.Web (Failing ❌)**:
```
[OIDC] Authorization code received
[OIDC] Token response received successfully
AuthenticationFailureException: Correlation failed.
```

DoorAuth successfully generates tokens, but the app can't accept them due to the missing correlation cookie.

## Solutions (Choose One)

### ✅ Solution 1: Run DoorAuth on HTTPS (Recommended)

**Why**: This eliminates the cross-scheme issue entirely.

**Steps**:
1. **Generate SSL certificate for DoorAuth**:
   ```bash
   cd path/to/doorauth/server
   # Generate self-signed cert
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. **Update DoorAuth to use HTTPS**:
   ```javascript
   // In DoorAuth server configuration
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('key.pem'),
     cert: fs.readFileSync('cert.pem')
   };
   
   https.createServer(options, app).listen(3000);
   ```

3. **Update VehicleManagement.Web appsettings.json**:
   ```json
   {
     "Authentication": {
       "Authority": "https://localhost:3000",  // Changed from http
       "ClientId": "rentmycar-f27d76b95553b0ae",
       "ClientSecret": "da29ac75a6706cb6eddf68edd021203529dd391453ad9a52a759291852cc6f1f"
     }
   }
   ```

4. **Update redirect URI in DoorAuth**:
   - Still use: `https://localhost:7231/signin-oidc`

5. **Restart both applications and test**

**Pros**:
- ✅ Most secure solution
- ✅ Works in production
- ✅ No code changes needed in VehicleManagement.Web

**Cons**:
- Requires DoorAuth server configuration changes
- Need to trust self-signed certificate in browser

---

### ✅ Solution 2: Run VehicleManagement.Web on HTTP

**Why**: Matches the protocol used by DoorAuth.

**Steps**:
1. **Update launchSettings.json**:
   ```json
   {
     "profiles": {
       "http": {
         "commandName": "Project",
         "launchBrowser": true,
         "applicationUrl": "http://localhost:7231",  // Changed from https
         "environmentVariables": {
           "ASPNETCORE_ENVIRONMENT": "Development"
         }
       }
     }
   }
   ```

2. **Update Program.cs** - Remove HTTPS redirect:
   ```csharp
   // Comment out or remove:
   // app.UseHttpsRedirection();
   ```

3. **Update redirect URI in DoorAuth**:
   - Change to: `http://localhost:7231/signin-oidc`

4. **Run with**:
   ```powershell
   dotnet run --launch-profile http
   ```

**Pros**:
- ✅ Quick fix
- ✅ No DoorAuth changes needed

**Cons**:
- ❌ Not secure (only for development)
- ❌ Cannot use in production
- ❌ Browser may show warnings

---

### ✅ Solution 3: Use a Reverse Proxy (Advanced)

**Why**: Terminates SSL at the proxy level, allowing both apps to communicate over HTTP internally.

**Steps**:
1. **Install nginx or use IIS**

2. **Configure proxy**:
   ```nginx
   server {
     listen 443 ssl;
     server_name localhost;
     
     ssl_certificate cert.pem;
     ssl_certificate_key key.pem;
     
     location /auth/ {
       proxy_pass http://localhost:3000/;
     }
     
     location / {
       proxy_pass http://localhost:7231/;
     }
   }
   ```

3. **Update both apps to use proxy URLs**

**Pros**:
- ✅ Production-ready
- ✅ Can handle multiple services

**Cons**:
- Complex setup
- Requires additional infrastructure

---

### ❌ Solution 4: Custom Authentication Handler (Not Recommended)

**Why**: Bypass the built-in OIDC middleware entirely.

This would require:
- Implementing manual OAuth 2.0 flow
- Handling token exchange manually
- Managing session cookies manually
- 200+ lines of custom code

**Not recommended** because it's error-prone and defeats the purpose of using a standard OIDC library.

---

## Recommended Action Plan

### For Development (Choose One):

**Option A: Quick Fix (5 minutes)**
1. Run VehicleManagement.Web on HTTP (Solution 2)
2. Update redirect URI in DoorAuth to `http://localhost:7231/signin-oidc`
3. Test login flow

**Option B: Proper Fix (15 minutes)**
1. Configure DoorAuth to use HTTPS (Solution 1)
2. Update Authority to `https://localhost:3000`
3. Trust the self-signed certificate
4. Test login flow

### For Production:
- **MUST use Solution 1 or 3** (HTTPS everywhere)
- Never use HTTP for authentication in production
- Consider using a proper SSL certificate from a CA

---

## Testing After Fix

Once you've applied one of the solutions:

1. **Clear all browser cookies** for both domains
2. **Restart both applications**
3. **Navigate to** `https://localhost:7231` (or `http://localhost:7231` if using Solution 2)
4. **Login with** `admin@demo.localhost`
5. **Expected result**: Successfully redirected to dashboard without "Correlation failed" error

---

## Files Modified (Current State)

### VehicleManagement.Web/Program.cs
- ✅ Added `CallbackPath = "/signin-oidc"`
- ✅ Configured cookies with `SameSiteMode.None`
- ✅ Added OIDC event logging
- ✅ Disabled telemetry
- ⚠️ Still has `RequireHttpsMetadata = false` (for dev)

### VehicleManagement.Web/Components/Pages/Error.razor
- ✅ Added `[AllowAnonymous]` attribute

### VehicleManagement.Web/Components/RedirectToLogin.razor
- ✅ Preserves return URL

### VehicleManagement.Web/appsettings.json
- ✅ Has correct ClientId and ClientSecret
- ⚠️ Authority is `http://localhost:3000` (needs to be HTTPS for Solution 1)

---

## Next Steps

**Choose your solution and let me know which one you'd like to implement:**

1. **Solution 1** (HTTPS DoorAuth) - I can help configure DoorAuth for HTTPS
2. **Solution 2** (HTTP app) - I can update the launch settings and redirect URI
3. **Solution 3** (Reverse proxy) - I can provide nginx/IIS configuration

Once you choose, I'll guide you through the implementation step-by-step.

---

## Important Notes

⚠️ **The correlation cookie issue CANNOT be fixed** with code changes in the VehicleManagement.Web application alone. It requires matching the protocols (both HTTP or both HTTPS).

⚠️ **DoorAuth is working correctly**. The logs confirm it's generating tokens successfully. The problem is entirely on the browser/middleware side with cookie handling.

⚠️ **This is a known limitation** of mixing HTTP and HTTPS in OAuth/OIDC flows. It's not a bug in your code or DoorAuth - it's a security feature of modern browsers.

---

**Status**: Waiting for user to choose a solution to proceed.
