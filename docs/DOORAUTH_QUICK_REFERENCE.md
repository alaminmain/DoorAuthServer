# DoorAuth Integration - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Install Packages
```powershell
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect --version 9.0.0
dotnet add package Microsoft.AspNetCore.Authentication.Cookies --version 2.2.0
```

### 2. Register App in DoorAuth

Add to `server/prisma/seed.ts`:
```typescript
{
    clientId: 'vehicle-management-web',
    clientSecret: 'vehicle-mgmt-secret-key',
    name: 'Vehicle Management System',
    appUrl: 'https://localhost:7231',
    redirectUris: 'https://localhost:7231/signin-oidc,https://localhost:7231/signout-callback-oidc',
    grantTypes: 'authorization_code,refresh_token',
    scopes: 'openid,profile,email',
    tenantId: 1,
    isActive: true
}
```

Run: `npx prisma db seed`

### 3. Add to Program.cs

```csharp
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

// Add authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
})
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    options.Authority = "https://localhost:3000";
    options.ClientId = "vehicle-management-web";
    options.ClientSecret = "vehicle-mgmt-secret-key";
    options.ResponseType = "code";
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    options.CallbackPath = "/signin-oidc";
    options.SignedOutCallbackPath = "/signout-callback-oidc";
    options.UsePkce = true;
    
    // Bypass self-signed certs (dev only)
    var handler = new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = 
            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
    };
    options.BackchannelHttpHandler = handler;
    
    // Cookie policies
    options.CorrelationCookie.SameSite = SameSiteMode.None;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
});

// ... other services ...

var app = builder.Build();

// Add middleware (ORDER MATTERS!)
app.UseAuthentication(); // Before UseAuthorization!
app.UseAuthorization();

// Add login/logout endpoints
app.MapGet("/login", (HttpContext context) =>
    Results.Challenge(
        new AuthenticationProperties { RedirectUri = "/" },
        authenticationSchemes: new[] { OpenIdConnectDefaults.AuthenticationScheme }
    ));

app.MapGet("/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignOutAsync(OpenIdConnectDefaults.AuthenticationScheme, 
        new AuthenticationProperties { RedirectUri = "/" });
});
```

### 4. Protect Pages

```razor
@page "/vehicles"
@attribute [Authorize]

<h1>Vehicles</h1>
```

### 5. Add Login Page

Create `Components/Pages/Login.razor`:
```razor
@page "/login"
@inject NavigationManager Navigation

<div style="text-align: center; padding: 100px;">
    <h1>Vehicle Management System</h1>
    <button @onclick="SignIn" style="padding: 15px 30px; font-size: 18px;">
        Sign In with DoorAuth
    </button>
</div>

@code {
    private void SignIn() => Navigation.NavigateTo("/login", forceLoad: true);
}
```

### 6. Update App.razor

```razor
<CascadingAuthenticationState>
    <Routes />
</CascadingAuthenticationState>
```

## ✅ Testing

1. Start DoorAuth: `cd server && npm run dev`
2. Start App: `dotnet run`
3. Visit: `https://localhost:7231`
4. Click "Sign In"
5. Login with: `bd@gmail.com` / `1q2w3E*`
6. ✅ You're authenticated!

## 🔧 Common Fixes

### "Correlation failed"
```csharp
options.CorrelationCookie.SameSite = SameSiteMode.None;
options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
```

### "Cannot redirect to end session"
```csharp
options.Configuration = new OpenIdConnectConfiguration
{
    EndSessionEndpoint = "https://localhost:3000/api/oauth/end_session"
};
```

### "Certificate error"
```csharp
var handler = new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = 
        HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
};
options.BackchannelHttpHandler = handler;
```

## 📊 Authentication Flow

```
User → App → /login
         ↓
    Redirect to DoorAuth
         ↓
    DoorAuth Login Page
         ↓
    User Enters Credentials
         ↓
    Generate Auth Code
         ↓
    Redirect to /signin-oidc?code=XXX
         ↓
    Exchange Code for Token
         ↓
    ✅ Authenticated!
```

## 🎯 Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/login` | Trigger authentication |
| `/logout` | Trigger logout |
| `/signin-oidc` | OAuth callback (automatic) |
| `/signout-callback-oidc` | Logout callback (automatic) |

## 🔐 DoorAuth Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://localhost:3000/api/oauth/authorize` | Authorization |
| `https://localhost:3000/api/oauth/token` | Token exchange |
| `https://localhost:3000/api/oauth/userinfo` | User info |
| `https://localhost:3000/api/oauth/end_session` | Logout |

## 📝 User Claims

Access user information:

```razor
@using Microsoft.AspNetCore.Components.Authorization

<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity?.Name</p>
        <p>Email: @context.User.FindFirst("email")?.Value</p>
        <p>Tenant: @context.User.FindFirst("tenantId")?.Value</p>
    </Authorized>
</AuthorizeView>
```

## 🎨 Styling Login Button

```css
.btn-doorauth {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.2s;
}

.btn-doorauth:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
}
```

## 🚨 Production Checklist

- [ ] Change `ClientSecret` to environment variable
- [ ] Enable `ValidateIssuer` and `ValidateAudience`
- [ ] Set `RequireHttpsMetadata = true`
- [ ] Remove certificate bypass
- [ ] Update `Authority` to production URL
- [ ] Enable logging
- [ ] Test SSO across all apps
- [ ] Test logout from all apps
- [ ] Implement session timeout
- [ ] Add error handling

## 📚 Resources

- Full Guide: `DOORAUTH_INTEGRATION_GUIDE.md`
- Test Report: `SSO_LOGOUT_TEST_REPORT.md`
- Best Practices: `SSO_LOGOUT_BEST_PRACTICES.md`
- DoorAuthSample: Reference implementation

## 🆘 Need Help?

1. Check logs: `appsettings.Development.json` → Set logging to `Debug`
2. Check browser DevTools → Application → Cookies
3. Check browser DevTools → Network → Filter "oauth"
4. Compare with DoorAuthSample implementation
5. Review troubleshooting section in full guide

---

**That's it! You're ready to go! 🎉**
