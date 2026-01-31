# DoorAuth Integration Examples

Quick code snippets for common integration scenarios.

---

## Table of Contents
1. [ASP.NET Core / Blazor (OIDC)](#aspnet-core--blazor-oidc)
2. [React SPA (OAuth PKCE)](#react-spa-oauth-pkce)
3. [Node.js/Express (JWT)](#nodejsexpress-jwt)
4. [Angular (OAuth PKCE)](#angular-oauth-pkce)
5. [Vue.js (OAuth PKCE)](#vuejs-oauth-pkce)

---

## ASP.NET Core / Blazor (OIDC)

### 1. Install Packages
```bash
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
dotnet add package Microsoft.AspNetCore.Authentication.Cookies
```

### 2. Configure Program.cs
```csharp
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

// Add authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.Name = "YourApp.Auth";
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
})
.AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    options.Authority = "https://localhost:3000";
    options.ClientId = "your-client-id";
    options.ClientSecret = "your-client-secret";
    options.ResponseType = "code";
    options.UsePkce = true;
    
    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Logout configuration
    options.SignedOutRedirectUri = "/";
    
    // Development only - bypass certificate validation
    options.BackchannelHttpHandler = new HttpClientHandler
    {
        ServerCertificateCustomValidationCallback = 
            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
    };
    
    // Cookie settings for SSO
    options.NonceCookie.SameSite = SameSiteMode.None;
    options.NonceCookie.SecurePolicy = CookieSecurePolicy.Always;
    options.CorrelationCookie.SameSite = SameSiteMode.None;
    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
    
    // Events for debugging
    options.Events = new OpenIdConnectEvents
    {
        OnRedirectToIdentityProvider = context =>
        {
            Console.WriteLine($"Redirecting to: {context.ProtocolMessage.IssuerAddress}");
            return Task.CompletedTask;
        },
        OnAuthorizationCodeReceived = context =>
        {
            Console.WriteLine($"Authorization code received: {context.TokenEndpointRequest?.Code}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"Token validated for user: {context.Principal?.Identity?.Name}");
            return Task.CompletedTask;
        },
        OnRemoteFailure = context =>
        {
            Console.WriteLine($"Remote failure: {context.Failure?.Message}");
            context.Response.Redirect("/error");
            context.HandleResponse();
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Middleware order is critical!
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();  // Must be before UseAuthorization
app.UseAuthorization();

app.MapRazorPages();
app.Run();
```

### 3. Login Page (Razor Pages)
```csharp
// Pages/Login.cshtml.cs
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

public class LoginModel : PageModel
{
    public IActionResult OnGet(string returnUrl = "/")
    {
        return Challenge(new AuthenticationProperties
        {
            RedirectUri = returnUrl
        }, OpenIdConnectDefaults.AuthenticationScheme);
    }
}
```

### 4. Logout Page
```csharp
// Pages/Logout.cshtml.cs
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

public class LogoutModel : PageModel
{
    public async Task<IActionResult> OnPostAsync()
    {
        // Sign out from local application
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        
        // Redirect to DoorAuth logout endpoint for SSO logout
        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Page("/Index", null, null, Request.Scheme)
        };
        
        return SignOut(properties, OpenIdConnectDefaults.AuthenticationScheme);
    }
}
```

### 5. Protect Pages
```csharp
// Pages/Dashboard.cshtml.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

[Authorize]
public class DashboardModel : PageModel
{
    public void OnGet()
    {
        var userName = User.Identity?.Name;
        var email = User.FindFirst("email")?.Value;
    }
}
```

### 6. Display User Info (Blazor)
```razor
@* Shared/LoginDisplay.razor *@
<AuthorizeView>
    <Authorized>
        <div class="user-info">
            <span>Hello, @context.User.Identity?.Name!</span>
            <form method="post" action="/Logout">
                <button type="submit">Logout</button>
            </form>
        </div>
    </Authorized>
    <NotAuthorized>
        <a href="/Login">Login</a>
    </NotAuthorized>
</AuthorizeView>
```

---

## React SPA (OAuth PKCE)

### 1. Install Dependencies
```bash
npm install axios
```

### 2. PKCE Helpers
```typescript
// utils/pkce.ts
function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(hash);
}
```

### 3. Auth Service
```typescript
// services/authService.ts
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

const AUTH_SERVER = 'https://localhost:3000';
const CLIENT_ID = 'your-client-id';
const REDIRECT_URI = 'http://localhost:5173/callback';

export const authService = {
  async login() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store verifier for later use
    sessionStorage.setItem('code_verifier', codeVerifier);
    
    const authUrl = new URL(`${AUTH_SERVER}/api/oauth/authorize`);
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', Math.random().toString(36));
    
    window.location.href = authUrl.toString();
  },
  
  async handleCallback(code: string) {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }
    
    const response = await fetch(`${AUTH_SERVER}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Token exchange failed');
    }
    
    const tokens = await response.json();
    
    // Store tokens (consider using memory instead of localStorage for security)
    sessionStorage.setItem('access_token', tokens.access_token);
    sessionStorage.setItem('id_token', tokens.id_token);
    if (tokens.refresh_token) {
      sessionStorage.setItem('refresh_token', tokens.refresh_token);
    }
    
    sessionStorage.removeItem('code_verifier');
    
    return tokens;
  },
  
  async getUserInfo() {
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) {
      throw new Error('No access token');
    }
    
    const response = await fetch(`${AUTH_SERVER}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  },
  
  logout() {
    const idToken = sessionStorage.getItem('id_token');
    
    // Clear local storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('refresh_token');
    
    // Redirect to DoorAuth logout
    const logoutUrl = new URL(`${AUTH_SERVER}/api/oauth/end_session`);
    if (idToken) {
      logoutUrl.searchParams.set('id_token_hint', idToken);
    }
    logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);
    
    window.location.href = logoutUrl.toString();
  },
};
```

### 4. Auth Context
```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  sub: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loadUser = async () => {
      const accessToken = sessionStorage.getItem('access_token');
      if (accessToken) {
        try {
          const userInfo = await authService.getUserInfo();
          setUser(userInfo);
        } catch (error) {
          console.error('Failed to load user', error);
          sessionStorage.clear();
        }
      }
    };
    
    loadUser();
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login: authService.login,
        logout: authService.logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 5. Callback Component
```typescript
// pages/Callback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Callback = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (!code) {
        navigate('/login');
        return;
      }
      
      try {
        await authService.handleCallback(code);
        navigate('/dashboard');
      } catch (error) {
        console.error('Callback error', error);
        navigate('/login');
      }
    };
    
    handleCallback();
  }, [navigate]);
  
  return <div>Processing login...</div>;
};
```

### 6. Protected Route
```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

---

## Node.js/Express (JWT)

### 1. Install Dependencies
```bash
npm install express jsonwebtoken axios
```

### 2. Auth Middleware
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

let publicKey = null;

async function getPublicKey() {
  if (publicKey) return publicKey;
  
  const response = await axios.get('https://localhost:3000/.well-known/jwks.json');
  const jwks = response.data;
  
  // Convert JWK to PEM (simplified - use a library like jwk-to-pem in production)
  publicKey = jwks.keys[0]; // Store the JWK
  return publicKey;
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    // In production, verify the token signature using the public key
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = authMiddleware;
```

### 3. Protected Routes
```javascript
// routes/api.js
const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public route
router.get('/public', (req, res) => {
  res.json({ message: 'Public endpoint' });
});

// Protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected endpoint',
    user: req.user,
  });
});

// Admin only route
router.get('/admin', authMiddleware, (req, res) => {
  const userRoles = req.user.roles || [];
  
  if (!userRoles.includes('Admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json({ message: 'Admin endpoint' });
});

module.exports = router;
```

### 4. Server Setup
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

app.use('/api', apiRoutes);

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
```

---

## Angular (OAuth PKCE)

### 1. Install Dependencies
```bash
npm install angular-oauth2-oidc
```

### 2. Auth Config
```typescript
// auth.config.ts
import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://localhost:3000',
  redirectUri: window.location.origin + '/callback',
  clientId: 'your-client-id',
  responseType: 'code',
  scope: 'openid profile email',
  showDebugInformation: true,
  
  // PKCE
  useSilentRefresh: true,
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
  
  // Endpoints (optional if using discovery)
  loginUrl: 'https://localhost:3000/api/oauth/authorize',
  tokenEndpoint: 'https://localhost:3000/api/oauth/token',
  userinfoEndpoint: 'https://localhost:3000/api/oauth/userinfo',
  logoutUrl: 'https://localhost:3000/api/oauth/end_session',
  
  // PKCE is enabled by default in angular-oauth2-oidc
};
```

### 3. Auth Service
```typescript
// services/auth.service.ts
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from '../auth.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private oauthService: OAuthService) {
    this.configure();
  }
  
  private configure() {
    this.oauthService.configure(authConfig);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }
  
  login() {
    this.oauthService.initCodeFlow();
  }
  
  logout() {
    this.oauthService.logOut();
  }
  
  get isAuthenticated(): boolean {
    return this.oauthService.hasValidAccessToken();
  }
  
  get userProfile() {
    return this.oauthService.getIdentityClaims();
  }
  
  get accessToken(): string {
    return this.oauthService.getAccessToken();
  }
}
```

### 4. Auth Guard
```typescript
// guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}
```

---

## Vue.js (OAuth PKCE)

### 1. PKCE Utilities
```typescript
// utils/pkce.ts
export async function generatePKCE() {
  const verifier = generateRandomString(128);
  const challenge = await generateChallenge(verifier);
  
  return { verifier, challenge };
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

function base64URLEncode(buffer: Uint8Array): string {
  const binary = String.fromCharCode(...buffer);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

### 2. Auth Store (Pinia)
```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import { generatePKCE } from '../utils/pkce';

const AUTH_SERVER = 'https://localhost:3000';
const CLIENT_ID = 'your-client-id';
const REDIRECT_URI = 'http://localhost:5173/callback';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    accessToken: null as string | null,
  }),
  
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },
  
  actions: {
    async login() {
      const { verifier, challenge } = await generatePKCE();
      sessionStorage.setItem('code_verifier', verifier);
      
      const authUrl = new URL(`${AUTH_SERVER}/api/oauth/authorize`);
      authUrl.searchParams.set('client_id', CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('code_challenge', challenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      
      window.location.href = authUrl.toString();
    },
    
    async handleCallback(code: string) {
      const verifier = sessionStorage.getItem('code_verifier');
      
      const response = await fetch(`${AUTH_SERVER}/api/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: CLIENT_ID,
          code_verifier: verifier!,
        }),
      });
      
      const tokens = await response.json();
      this.accessToken = tokens.access_token;
      
      await this.fetchUser();
    },
    
    async fetchUser() {
      const response = await fetch(`${AUTH_SERVER}/api/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      
      this.user = await response.json();
    },
    
    logout() {
      this.user = null;
      this.accessToken = null;
      
      const logoutUrl = new URL(`${AUTH_SERVER}/api/oauth/end_session`);
      logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);
      
      window.location.href = logoutUrl.toString();
    },
  },
});
```

---

## Common Patterns

### Token Refresh
```typescript
// Automatic token refresh before expiration
let refreshTimer: NodeJS.Timeout;

function scheduleTokenRefresh(expiresIn: number) {
  clearTimeout(refreshTimer);
  
  // Refresh 5 minutes before expiration
  const refreshTime = (expiresIn - 300) * 1000;
  
  refreshTimer = setTimeout(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error('Token refresh failed', error);
      logout();
    }
  }, refreshTime);
}

async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem('refresh_token');
  
  const response = await fetch('https://localhost:3000/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken!,
      client_id: 'your-client-id',
    }),
  });
  
  const tokens = await response.json();
  sessionStorage.setItem('access_token', tokens.access_token);
  
  scheduleTokenRefresh(tokens.expires_in);
}
```

### Axios Interceptor
```typescript
// Add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await refreshAccessToken();
        // Retry original request
        return axios(error.config);
      } catch {
        // Refresh failed, logout
        logout();
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Testing Integration

### Test Credentials
```
Email: bd@gmail.com
Password: 1q2w3E*
Tenant: Default
```

### Test Checklist
- [ ] User can login
- [ ] User info is displayed correctly
- [ ] Protected routes require authentication
- [ ] User can logout
- [ ] SSO works (login to one app, auto-login to another)
- [ ] SSO logout works (logout from one app logs out from all)
- [ ] Tokens are refreshed automatically
- [ ] Expired tokens redirect to login
