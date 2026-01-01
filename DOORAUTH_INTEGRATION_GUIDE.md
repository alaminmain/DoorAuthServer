# DoorAuth Integration Guide
## Integrating DoorAuth SSO into VehicleManagement.Web (Blazor Server)

**Version**: 1.0  
**Date**: 2026-01-01  
**Target Application**: VehicleManagement.Web (Blazor Server .NET 9)  
**Authentication Server**: DoorAuth (https://localhost:3000)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

This guide walks you through integrating DoorAuth SSO (Single Sign-On) authentication into the VehicleManagement.Web Blazor Server application using OpenID Connect (OIDC) protocol.

### What You'll Achieve

✅ **Single Sign-On**: Users log in once and access all applications  
✅ **Centralized Authentication**: All auth logic handled by DoorAuth  
✅ **Secure Token-Based Auth**: OAuth 2.0 + OIDC standards  
✅ **Single Sign-Out**: Logout from one app logs out from all  
✅ **Multi-Tenant Support**: Built-in tenant isolation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DoorAuth Architecture                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   DoorAuth Server    │  ← Central Authentication Server
│  (localhost:3000)    │     - User Management
│                      │     - OAuth 2.0 / OIDC
└──────────┬───────────┘     - Multi-Tenant
           │
           │ OAuth 2.0 / OIDC
           │
    ┌──────┴──────┬──────────────┬─────────────┐
    │             │              │             │
┌───▼────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│Vehicle │  │DoorAuth  │  │Client    │  │  Other   │
│Mgmt Web│  │Sample    │  │Todo      │  │  Apps    │
│:7231   │  │:7140     │  │:5175     │  │  ...     │
└────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Authentication Flow

```
User → VehicleManagement.Web → DoorAuth Server → Login Page
                                      ↓
                                 Authenticate
                                      ↓
                            Generate Auth Code
                                      ↓
VehicleManagement.Web ← Auth Code ← DoorAuth
         ↓
   Exchange Code for Token
         ↓
    Access Protected Resources
```

---

## Prerequisites

### 1. DoorAuth Server Running

Ensure DoorAuth server is running on `https://localhost:3000`:

```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npm run dev
```

### 2. Required NuGet Packages

The following packages will be added to `VehicleManagement.Web.csproj`:

- `Microsoft.AspNetCore.Authentication.OpenIdConnect` (v9.0.0)
- `Microsoft.AspNetCore.Authentication.Cookies` (v2.2.0)

### 3. Application Registration in DoorAuth

Your application must be registered in the DoorAuth database. We'll add this configuration.

---

## Step-by-Step Integration

### Step 1: Register Application in DoorAuth Database

First, we need to register the VehicleManagement.Web application in DoorAuth.

**File**: `server/prisma/seed.ts`

Add the following application configuration:

```typescript
// Vehicle Management Web Application
{
    clientId: 'vehicle-management-web',
    clientSecret: 'vehicle-mgmt-secret-key-change-in-production',
    name: 'Vehicle Management System',
    description: 'Comprehensive vehicle fleet management system',
    appUrl: 'https://localhost:7231',
    redirectUris: 'https://localhost:7231/signin-oidc,https://localhost:7231/signout-callback-oidc',
    grantTypes: 'authorization_code,refresh_token',
    scopes: 'openid,profile,email',
    tenantId: 1, // Default tenant
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
}
```

**Run the seed script**:

```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\server
npx prisma db seed
```

---

### Step 2: Install Required NuGet Packages

Add the OIDC authentication packages to your project:

```powershell
cd e:\Project\TestProjects\DoorAuthServer\DoorAuthServer\NewVehicleManagment\VehicleManagementSystem\VehicleManagement.Web\VehicleManagement.Web

dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect --version 9.0.0
dotnet add package Microsoft.AspNetCore.Authentication.Cookies --version 2.2.0
```

---

### Step 3: Update `Program.cs`

Replace the authentication configuration in `Program.cs`:

**File**: `VehicleManagement.Web/Program.cs`

```csharp
using VehicleManagement.Web.Components;
using VehicleManagement.Web.Client.Services;
using VehicleManagement.Shared.Interfaces;
using Radzen;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// ============================================================================
// DOORAUTH SSO AUTHENTICATION CONFIGURATION
// ============================================================================

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.Name = "VehicleManagement.Auth";
})
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    // DoorAuth Server Configuration
    options.Authority = "https://localhost:3000";
    options.ClientId = "vehicle-management-web";
    options.ClientSecret = "vehicle-mgmt-secret-key-change-in-production";
    
    options.ResponseType = OpenIdConnectResponseType.Code;
    options.ResponseMode = OpenIdConnectResponseMode.Query;
    
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Callback paths
    options.CallbackPath = "/signin-oidc";
    options.SignedOutCallbackPath = "/signout-callback-oidc";
    
    // OIDC Endpoints
    options.MetadataAddress = "https://localhost:3000/.well-known/openid-configuration";
    options.RequireHttpsMetadata = false; // For development only
    
    // Explicitly configure endpoints
    options.Configuration = new OpenIdConnectConfiguration
    {
        Issuer = "https://localhost:3000",
        AuthorizationEndpoint = "https://localhost:3000/api/oauth/authorize",
        TokenEndpoint = "https://localhost:3000/api/oauth/token",
        UserInfoEndpoint = "https://localhost:3000/api/oauth/userinfo",
        EndSessionEndpoint = "https://localhost:3000/api/oauth/end_session",
        JwksUri = "https://localhost:3000/.well-known/jwks.json"
    };
    
    // Use PKCE for enhanced security
    options.UsePkce = true;
    
    // Token validation (relaxed for development)
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role",
        ValidateIssuer = false, // Development only
        ValidateAudience = false, // Development only
        SignatureValidator = (token, parameters) => 
            new Microsoft.IdentityModel.JsonWebTokens.JsonWebToken(token)
    };
    
    // Protocol validator (relaxed for localhost)
    options.ProtocolValidator = new OpenIdConnectProtocolValidator
    {
        RequireNonce = false,
        RequireState = false,
        RequireStateValidation = false
    };
    
    // Bypass self-signed certificate errors (development only)
    var httpClientHandler = new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = 
            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
    };
    options.BackchannelHttpHandler = httpClientHandler;
    
    // Cookie policies for correlation
    options.CorrelationCookie.SameSite = SameSiteMode.None;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    options.NonceCookie.SameSite = SameSiteMode.None;
    options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
    
    // Event handlers for debugging
    options.Events = new OpenIdConnectEvents
    {
        OnRedirectToIdentityProvider = context =>
        {
            Console.WriteLine($"[VehicleManagement OIDC] Redirecting to: {context.ProtocolMessage.RedirectUri}");
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"[VehicleManagement OIDC] Auth Failed: {context.Exception.Message}");
            return Task.CompletedTask;
        },
        OnTicketReceived = context =>
        {
            Console.WriteLine($"[VehicleManagement OIDC] Ticket Received. User: {context.Principal?.Identity?.Name}");
            return Task.CompletedTask;
        },
        OnRemoteFailure = context =>
        {
            Console.WriteLine($"[VehicleManagement OIDC] Remote Failure: {context.Failure?.Message}");
            context.Response.Redirect("/");
            context.HandleResponse();
            return Task.CompletedTask;
        }
    };
});

// ============================================================================
// END DOORAUTH CONFIGURATION
// ============================================================================

// Register HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Register authenticated HTTP client handler
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.Configuration["ApiBaseUrl"] ?? "https://localhost:7281")
});

// Register services
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IDriverService, DriverService>();
builder.Services.AddScoped<ILegalCaseService, LegalCaseService>();
builder.Services.AddScoped<IMaintenanceLogService, MaintenanceLogService>();
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddScoped<ITripService, TripService>();
builder.Services.AddScoped<IDriverDayOffService, DriverDayOffService>();
builder.Services.AddScoped<ILocationService, LocationService>();

// Add Radzen services
builder.Services.AddScoped<DialogService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<TooltipService>();
builder.Services.AddScoped<ContextMenuService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseWebAssemblyDebugging();
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// ============================================================================
// AUTHENTICATION MIDDLEWARE (IMPORTANT ORDER!)
// ============================================================================
app.UseAuthentication(); // Must come before UseAuthorization
app.UseAuthorization();
// ============================================================================

app.UseAntiforgery();

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// Login endpoint
app.MapGet("/login", (HttpContext context) =>
{
    return Results.Challenge(
        new AuthenticationProperties { RedirectUri = "/" },
        authenticationSchemes: new List<string> { OpenIdConnectDefaults.AuthenticationScheme }
    );
});

// Logout endpoint
app.MapGet("/logout", async (HttpContext context) =>
{
    // Sign out from both cookie and OIDC schemes
    // This clears local cookies AND redirects to DoorAuth end_session
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignOutAsync(OpenIdConnectDefaults.AuthenticationScheme, 
        new AuthenticationProperties
        {
            RedirectUri = "/"
        });
});

// ============================================================================

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddAdditionalAssemblies(
        typeof(VehicleManagement.Web.Client._Imports).Assembly,
        typeof(VehicleManagement.UI.Layout.MainLayout).Assembly);

app.Run();
```

---

### Step 4: Update `appsettings.json`

Add DoorAuth configuration:

**File**: `VehicleManagement.Web/appsettings.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.AspNetCore.Authentication": "Debug"
    }
  },
  "AllowedHosts": "*",
  "ApiBaseUrl": "https://localhost:7281",
  "DoorAuth": {
    "Authority": "https://localhost:3000",
    "ClientId": "vehicle-management-web",
    "ClientSecret": "vehicle-mgmt-secret-key-change-in-production",
    "Scopes": "openid profile email"
  }
}
```

---

### Step 5: Create Login Page Component

Create a login page for unauthenticated users:

**File**: `VehicleManagement.Web/Components/Pages/Login.razor`

```razor
@page "/login"
@inject NavigationManager Navigation

<PageTitle>Login - Vehicle Management</PageTitle>

<div class="login-container">
    <div class="login-card">
        <div class="login-header">
            <h1>🚗 Vehicle Management System</h1>
            <p>Please sign in to continue</p>
        </div>
        
        <div class="login-body">
            <button class="btn-login" @onclick="SignIn">
                <span class="icon">🔐</span>
                Sign In with DoorAuth
            </button>
        </div>
        
        <div class="login-footer">
            <p>Secure authentication powered by DoorAuth</p>
        </div>
    </div>
</div>

@code {
    private void SignIn()
    {
        Navigation.NavigateTo("/login", forceLoad: true);
    }
}

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .login-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        padding: 48px;
        max-width: 400px;
        width: 100%;
        text-align: center;
    }
    
    .login-header h1 {
        font-size: 28px;
        margin-bottom: 8px;
        color: #333;
    }
    
    .login-header p {
        color: #666;
        margin-bottom: 32px;
    }
    
    .btn-login {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 16px 32px;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-login:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
    }
    
    .btn-login .icon {
        font-size: 24px;
    }
    
    .login-footer {
        margin-top: 32px;
        color: #999;
        font-size: 14px;
    }
</style>
```

---

### Step 6: Update Main Layout with Authentication

Update your main layout to show user info and logout button:

**File**: `VehicleManagement.UI/Layout/MainLayout.razor` (or wherever your layout is)

Add this to the top bar:

```razor
@using Microsoft.AspNetCore.Components.Authorization

<AuthorizeView>
    <Authorized>
        <div class="user-info">
            <span>Welcome, @context.User.Identity?.Name</span>
            <button class="btn-logout" @onclick="Logout">
                Logout
            </button>
        </div>
    </Authorized>
    <NotAuthorized>
        <button class="btn-login" @onclick="Login">
            Sign In
        </button>
    </NotAuthorized>
</AuthorizeView>

@code {
    [Inject] private NavigationManager Navigation { get; set; } = default!;
    
    private void Login()
    {
        Navigation.NavigateTo("/login", forceLoad: true);
    }
    
    private void Logout()
    {
        Navigation.NavigateTo("/logout", forceLoad: true);
    }
}
```

---

### Step 7: Protect Pages with `[Authorize]`

Add the `[Authorize]` attribute to pages that require authentication:

```razor
@page "/vehicles"
@attribute [Authorize]

<PageTitle>Vehicles</PageTitle>

<!-- Your page content -->
```

---

### Step 8: Add CascadingAuthenticationState

Update your `App.razor` to provide authentication state:

**File**: `VehicleManagement.Web/Components/App.razor`

```razor
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="bootstrap/bootstrap.min.css" />
    <link rel="stylesheet" href="app.css" />
    <link rel="stylesheet" href="VehicleManagement.Web.styles.css" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <HeadOutlet />
</head>

<body>
    <CascadingAuthenticationState>
        <Routes />
    </CascadingAuthenticationState>
    
    <script src="_framework/blazor.web.js"></script>
</body>

</html>
```

---

## Configuration

### Environment-Specific Settings

**Development** (`appsettings.Development.json`):
```json
{
  "DoorAuth": {
    "Authority": "https://localhost:3000",
    "RequireHttpsMetadata": false
  }
}
```

**Production** (`appsettings.Production.json`):
```json
{
  "DoorAuth": {
    "Authority": "https://auth.yourdomain.com",
    "RequireHttpsMetadata": true,
    "ClientSecret": "USE-ENVIRONMENT-VARIABLE-IN-PRODUCTION"
  }
}
```

### Security Best Practices

1. **Never commit secrets** - Use environment variables or Azure Key Vault
2. **Enable HTTPS** - Always use HTTPS in production
3. **Validate tokens** - Enable issuer and audience validation in production
4. **Use strong secrets** - Generate cryptographically secure client secrets
5. **Implement PKCE** - Already enabled (`options.UsePkce = true`)

---

## Testing

### Test Checklist

- [ ] **Step 1**: Start DoorAuth server (`npm run dev` in `server/`)
- [ ] **Step 2**: Start VehicleManagement.Web (`dotnet run`)
- [ ] **Step 3**: Navigate to `https://localhost:7231`
- [ ] **Step 4**: Click "Sign In with DoorAuth"
- [ ] **Step 5**: Redirected to DoorAuth login page
- [ ] **Step 6**: Enter credentials (e.g., `bd@gmail.com` / `1q2w3E*`)
- [ ] **Step 7**: Redirected back to VehicleManagement.Web
- [ ] **Step 8**: See welcome message with username
- [ ] **Step 9**: Access protected pages
- [ ] **Step 10**: Click "Logout"
- [ ] **Step 11**: Verify logout from all apps (SSO logout)

### Test Scenarios

#### Scenario 1: First-Time Login
```
1. User visits https://localhost:7231
2. Not authenticated → Redirected to /login
3. Clicks "Sign In with DoorAuth"
4. Redirected to https://localhost:3000/api/oauth/authorize
5. DoorAuth shows login form
6. User enters credentials
7. DoorAuth generates authorization code
8. Redirects to https://localhost:7231/signin-oidc?code=...
9. VehicleManagement.Web exchanges code for token
10. User authenticated → Redirected to dashboard
```

#### Scenario 2: SSO Login
```
1. User already logged into DoorAuthSample
2. Visits https://localhost:7231
3. Redirected to DoorAuth
4. DoorAuth detects existing session
5. Auto-redirects back with auth code (no login form!)
6. User authenticated immediately
```

#### Scenario 3: Logout
```
1. User clicks "Logout"
2. VehicleManagement.Web calls SignOutAsync
3. Redirected to https://localhost:3000/api/oauth/end_session
4. DoorAuth clears all cookies
5. Redirected back to VehicleManagement.Web
6. User logged out
7. Try accessing DoorAuthSample → Must login again (SSO logout!)
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Correlation failed" Error

**Cause**: Cookie SameSite policy mismatch

**Solution**: Ensure cookies have `SameSite=None` and `Secure=true`:
```csharp
options.CorrelationCookie.SameSite = SameSiteMode.None;
options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
```

#### Issue 2: "Cannot redirect to the end session endpoint"

**Cause**: `EndSessionEndpoint` not configured

**Solution**: Explicitly set the endpoint:
```csharp
options.Configuration = new OpenIdConnectConfiguration
{
    EndSessionEndpoint = "https://localhost:3000/api/oauth/end_session"
};
```

#### Issue 3: Self-Signed Certificate Errors

**Cause**: HTTPS with self-signed certs in development

**Solution**: Bypass validation (development only):
```csharp
var httpClientHandler = new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = 
        HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
};
options.BackchannelHttpHandler = httpClientHandler;
```

#### Issue 4: "invalid_grant" Error

**Cause**: Client secret mismatch or expired code

**Solution**: 
1. Verify `ClientSecret` matches database
2. Check authorization code hasn't expired (5 minutes)
3. Ensure PKCE is enabled

#### Issue 5: User Not Authenticated After Redirect

**Cause**: Missing `UseAuthentication()` middleware

**Solution**: Add middleware in correct order:
```csharp
app.UseAuthentication(); // Before UseAuthorization!
app.UseAuthorization();
```

### Debug Logging

Enable detailed logging in `appsettings.Development.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.AspNetCore.Authentication": "Debug",
      "Microsoft.AspNetCore.Authentication.OpenIdConnect": "Trace"
    }
  }
}
```

### Browser DevTools

1. **Check Cookies**: Application → Cookies → `https://localhost:7231`
   - Look for `.AspNetCore.Cookies` and correlation cookies
   
2. **Check Network**: Network tab → Filter by "authorize", "token", "userinfo"
   - Verify requests to DoorAuth endpoints
   
3. **Check Console**: Look for OIDC event logs

---

## Best Practices

### 1. Security

✅ **Use PKCE**: Already enabled (`options.UsePkce = true`)  
✅ **HTTPS Only**: Always use HTTPS in production  
✅ **Secure Cookies**: `HttpOnly`, `Secure`, `SameSite=None`  
✅ **Token Validation**: Enable in production  
✅ **Secret Management**: Use environment variables or Key Vault

### 2. User Experience

✅ **Auto-Redirect**: Redirect unauthenticated users to login  
✅ **SSO**: Leverage existing DoorAuth sessions  
✅ **Logout Confirmation**: Consider adding confirmation dialog  
✅ **Session Timeout**: Implement automatic logout after inactivity

### 3. Error Handling

✅ **Graceful Failures**: Handle auth errors gracefully  
✅ **User-Friendly Messages**: Show helpful error messages  
✅ **Logging**: Log all auth events for debugging  
✅ **Fallback**: Provide fallback for auth failures

### 4. Performance

✅ **Token Caching**: Tokens are cached by default  
✅ **Minimize Redirects**: Use SSO to avoid repeated logins  
✅ **Async Operations**: All auth operations are async

---

## Next Steps

After successful integration:

1. **Add Role-Based Authorization**: Use `[Authorize(Roles = "Admin")]`
2. **Implement Claims-Based Auth**: Access user claims for personalization
3. **Add Tenant Isolation**: Use `tenantId` claim for multi-tenancy
4. **Implement Refresh Tokens**: For long-lived sessions
5. **Add Audit Logging**: Track all authentication events
6. **Configure Production**: Update settings for production deployment

---

## Summary

You've successfully integrated DoorAuth SSO into VehicleManagement.Web! 🎉

**What You Accomplished**:
- ✅ Configured OIDC authentication
- ✅ Implemented SSO login
- ✅ Added SSO logout
- ✅ Protected routes with `[Authorize]`
- ✅ Created user-friendly login page

**Key Files Modified**:
1. `Program.cs` - Authentication configuration
2. `appsettings.json` - DoorAuth settings
3. `Components/Pages/Login.razor` - Login page
4. `Components/App.razor` - Authentication state provider

**Testing**:
- Navigate to `https://localhost:7231`
- Click "Sign In with DoorAuth"
- Login with DoorAuth credentials
- Access protected pages
- Test SSO with other apps
- Test logout (single sign-out)

For questions or issues, refer to the [Troubleshooting](#troubleshooting) section or check the DoorAuthSample implementation for reference.

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-01  
**Author**: DoorAuth Integration Team
