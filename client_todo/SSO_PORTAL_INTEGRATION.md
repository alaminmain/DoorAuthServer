# DoorAuth Integration Tutorial - SSO Portal Pattern

## 🎯 Overview

This tutorial explains how to integrate applications with the **DoorAuth SSO Portal** system, where:

1. **Users log in once** to the DoorAuthSample dashboard (the portal)
2. **See all their authorized applications** as cards
3. **Click to launch apps** with automatic SSO authentication
4. **No repeated logins** - seamless access across all apps

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │        DoorAuthSample Dashboard (Portal)               │    │
│  │        https://localhost:7140                          │    │
│  │                                                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │  App 1   │  │  App 2   │  │  App 3   │            │    │
│  │  │  Card    │  │  Card    │  │  Card    │            │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │    │
│  │       │             │             │                    │    │
│  │       │ Click       │ Click       │ Click             │    │
│  │       ▼             ▼             ▼                    │    │
│  │  Launch with SSO token                                │    │
│  └────────────────────────────────────────────────────────┘    │
│         │                │                │                    │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │ Todo    │      │ Vehicle │      │ Other   │
    │ App     │      │ Mgmt    │      │ App     │
    │ :5175   │      │ :7231   │      │ :XXXX   │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  DoorAuth      │
                 │  Server        │
                 │  :3000         │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │  PostgreSQL    │
                 │  Database      │
                 └────────────────┘
```

---

## 📋 Integration Patterns

There are **two ways** to integrate your application with DoorAuth:

### Pattern 1: Direct OAuth Integration (client_todo example)
- App handles OAuth flow independently
- User logs in directly to the app
- Good for: Standalone apps, external apps

### Pattern 2: SSO Portal Integration (Recommended)
- User logs in to DoorAuthSample dashboard
- Apps receive SSO token from portal
- Good for: Internal apps, enterprise suite

---

## 🚀 Pattern 2: SSO Portal Integration (Step-by-Step)

### Step 1: Register Your Application in DoorAuth

Your application must be registered in the database with:

```sql
INSERT INTO "Application" (
    id, 
    name, 
    "clientId", 
    "clientSecret", 
    "redirectUris", 
    "allowedScopes", 
    "appUrl",           -- ⭐ Important for portal!
    "isActive", 
    "createdAt", 
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'My Application',                          -- Display name
    'my-app-client',                           -- Client ID
    'my-app-secret',                           -- Client Secret
    ARRAY['https://localhost:5175/callback'],  -- OAuth callback
    ARRAY['openid', 'profile', 'email'],       -- Scopes
    'https://localhost:5175',                  -- ⭐ App URL for portal card
    true,
    NOW(),
    NOW()
);
```

**Key fields:**
- `appUrl`: The URL shown on the dashboard card - users click this to launch your app
- `name`: Display name shown on the dashboard card
- `redirectUris`: OAuth callback URL for authentication

### Step 2: Configure Your App to Accept SSO Tokens

Your application needs to:

#### Option A: Accept Token from URL Parameter (Simple)

```typescript
// In your app's entry point
const urlParams = new URLSearchParams(window.location.search);
const ssoToken = urlParams.get('token');

if (ssoToken) {
    // Store the token
    localStorage.setItem('access_token', ssoToken);
    
    // Decode to get user info
    const user = jwtDecode(ssoToken);
    
    // Clean URL (remove token from address bar)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Redirect to dashboard
    navigate('/dashboard');
}
```

#### Option B: Accept Token from PostMessage (More Secure)

```typescript
// Listen for SSO token from parent window (portal)
window.addEventListener('message', (event) => {
    // Verify origin
    if (event.origin !== 'https://localhost:7140') return;
    
    if (event.data.type === 'SSO_TOKEN') {
        const token = event.data.token;
        localStorage.setItem('access_token', token);
        
        const user = jwtDecode(token);
        setUser(user);
    }
});

// Notify portal that app is ready
window.parent.postMessage({ type: 'APP_READY' }, 'https://localhost:7140');
```

### Step 3: Update DoorAuthSample to Pass Token

The portal needs to pass the token when launching your app:

```csharp
// In DoorAuthSample/Pages/Index.cshtml
<div class="app-card" onclick="launchApp('@app.AppUrl', '@accessToken')">
    <h3>@app.Name</h3>
    <p>@app.Description</p>
</div>

<script>
function launchApp(appUrl, token) {
    // Option A: Pass token in URL
    window.open(`${appUrl}?token=${token}`, '_blank');
    
    // Option B: Open in iframe and use postMessage
    // const iframe = document.getElementById('app-iframe');
    // iframe.src = appUrl;
    // iframe.onload = () => {
    //     iframe.contentWindow.postMessage({
    //         type: 'SSO_TOKEN',
    //         token: token
    //     }, appUrl);
    // };
}
</script>
```

### Step 4: Implement Token Validation

Your app should validate the token:

```typescript
import { jwtDecode } from 'jwt-decode';

function validateToken(token: string): boolean {
    try {
        const decoded = jwtDecode<{ exp: number }>(token);
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
            console.error('Token expired');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Invalid token', error);
        return false;
    }
}

// Usage
const token = localStorage.getItem('access_token');
if (token && validateToken(token)) {
    // Token is valid, proceed
} else {
    // Redirect back to portal or show error
    window.location.href = 'https://localhost:7140';
}
```

---

## 🔄 Complete SSO Flow

```
1. User opens DoorAuthSample dashboard
   └─ https://localhost:7140

2. User logs in with credentials
   └─ DoorAuth validates & issues JWT token

3. Dashboard shows app cards
   └─ Each card has appUrl from database

4. User clicks "Todo App" card
   └─ Dashboard calls: launchApp('https://localhost:5175', token)

5. Todo app opens with token in URL
   └─ https://localhost:5175?token=eyJhbGc...

6. Todo app extracts & validates token
   ├─ localStorage.setItem('access_token', token)
   ├─ Decode JWT to get user info
   └─ Clean URL (remove token)

7. User is logged in to Todo app!
   └─ No separate login required
```

---

## 📝 Implementation Checklist

### For Application Developers:

- [ ] Register app in DoorAuth database with `appUrl`
- [ ] Implement token reception (URL param or postMessage)
- [ ] Validate received token
- [ ] Store token in localStorage
- [ ] Decode token to get user info
- [ ] Clean URL after receiving token
- [ ] Handle token expiry
- [ ] Implement logout (clear token + redirect to portal)

### For Portal Administrators:

- [ ] Ensure DoorAuthSample is running
- [ ] Verify app is registered with correct `appUrl`
- [ ] Test SSO token passing
- [ ] Verify app cards display correctly
- [ ] Test launching apps from portal

---

## 🔧 Configuration Examples

### Example 1: React App (client_todo)

**Update `src/App.tsx`:**

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function App() {
    const navigate = useNavigate();
    
    useEffect(() => {
        // Check for SSO token in URL
        const urlParams = new URLSearchParams(window.location.search);
        const ssoToken = urlParams.get('token');
        
        if (ssoToken) {
            try {
                // Validate token
                const decoded = jwtDecode<{ exp: number }>(ssoToken);
                if (decoded.exp * 1000 > Date.now()) {
                    // Token is valid
                    localStorage.setItem('access_token', ssoToken);
                    
                    // Clean URL
                    window.history.replaceState({}, '', window.location.pathname);
                    
                    // Redirect to dashboard
                    navigate('/dashboard');
                } else {
                    console.error('Token expired');
                }
            } catch (error) {
                console.error('Invalid SSO token', error);
            }
        }
    }, [navigate]);
    
    return (
        <AuthProvider>
            {/* Your app routes */}
        </AuthProvider>
    );
}
```

### Example 2: Blazor App (VehicleManagement.Web)

**Update `Program.cs`:**

```csharp
app.MapGet("/sso-login", async (HttpContext context) =>
{
    var token = context.Request.Query["token"].ToString();
    
    if (!string.IsNullOrEmpty(token))
    {
        // Validate token (implement your validation logic)
        if (ValidateJwtToken(token))
        {
            // Store token in cookie or session
            context.Response.Cookies.Append("access_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });
            
            // Redirect to dashboard
            context.Response.Redirect("/");
        }
    }
    
    return Results.BadRequest("Invalid token");
});
```

---

## 🎨 Portal Dashboard Card Design

The DoorAuthSample dashboard should display apps like this:

```html
<div class="app-grid">
    @foreach (var app in userApps)
    {
        <div class="app-card" onclick="launchApp('@app.AppUrl', '@accessToken')">
            <div class="app-icon">
                <i class="@app.Icon"></i>
            </div>
            <h3 class="app-name">@app.Name</h3>
            <p class="app-description">@app.Description</p>
            <button class="launch-btn">Launch App</button>
        </div>
    }
</div>

<style>
.app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px;
}

.app-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s;
}

.app-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
```

---

## 🔐 Security Considerations

### Token Security
- ✅ Use HTTPS for all communications
- ✅ Validate token signature
- ✅ Check token expiry
- ✅ Verify token issuer
- ✅ Clean token from URL after use

### CORS Configuration
```typescript
// In DoorAuth server
app.use(cors({
    origin: [
        'https://localhost:7140',  // Portal
        'https://localhost:5175',  // Todo App
        'https://localhost:7231',  // Vehicle Mgmt
        // Add other app URLs
    ],
    credentials: true
}));
```

### Content Security Policy
```html
<!-- In your app's index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               connect-src 'self' https://localhost:3000;
               frame-ancestors https://localhost:7140;">
```

---

## 🧪 Testing the Integration

### Test Scenario 1: SSO Login Flow

1. **Start all services:**
   ```bash
   # Terminal 1: DoorAuth Server
   cd server && npm run dev
   
   # Terminal 2: DoorAuthSample Portal
   cd DoorAuthSample && dotnet run
   
   # Terminal 3: Your App
   cd client_todo && npm run dev
   ```

2. **Open portal:** `https://localhost:7140`

3. **Login** with test credentials

4. **Verify** app card appears with correct name and appUrl

5. **Click** app card

6. **Verify** app opens in new tab with token

7. **Check** app automatically logs you in

### Test Scenario 2: Token Validation

1. Open browser DevTools → Application → Local Storage
2. Verify `access_token` is stored
3. Copy token and decode at [jwt.io](https://jwt.io)
4. Verify user info matches logged-in user
5. Check expiry time is in the future

### Test Scenario 3: Token Expiry

1. Manually set token expiry to past
2. Refresh app
3. Verify app redirects to portal or shows login

---

## 🚪 Implementing Centralized Logout

### Overview

When a user logs out from any application, they should be logged out from the **entire DoorAuth system**, including the portal and all connected apps.

### Logout Flow

```
1. User clicks Logout in App
   ↓
2. App clears local token
   ↓
3. App triggers cross-tab logout event
   ↓
4. Redirect to: https://localhost:7140/logout
   ↓
5. Portal clears session cookies
   ↓
6. Portal calls: https://localhost:3000/api/oauth/end_session
   ↓
7. DoorAuth clears server session
   ↓
8. Redirect back to portal home
   ↓
9. User is logged out everywhere ✅
```

### Implementation Steps

#### Step 1: Update Logout Function in Your App

```typescript
// In AuthProvider.tsx or similar
const logout = () => {
    console.log('👋 Logout initiated');
    
    // Clear local token
    localStorage.removeItem('access_token');
    setUser(null);
    
    // Trigger logout event for cross-tab synchronization
    localStorage.setItem('logout-event', Date.now().toString());
    
    // Redirect to portal logout for centralized logout
    window.location.href = 'https://localhost:7140/logout';
};
```

#### Step 2: Add Cross-Tab Logout Detection

```typescript
// Listen for logout events from other tabs
useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'logout-event') {
            console.log('🔔 Logout event detected from another tab');
            // Clear local state
            localStorage.removeItem('access_token');
            setUser(null);
            // Redirect to login
            window.location.href = '/login';
        }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
}, []);
```

#### Step 3: Add "Back to Portal" Button

```typescript
// In your Dashboard component
<header>
    <h1>My App</h1>
    <div className="actions">
        <a href="https://localhost:7140" className="portal-link">
            ← Back to Portal
        </a>
        <button onClick={logout} title="Logout from DoorAuth (all apps)">
            <LogOut /> Logout
        </button>
    </div>
</header>
```

#### Step 4: Update Portal Launch Function

**Important:** Apps should replace the current window, not open in new tabs, to ensure single session context:

```javascript
// In DoorAuthSample/Pages/Index.cshtml
function launchApp(appUrl, appName) {
    const token = document.getElementById('accessToken').value;
    
    if (!token) {
        alert('No access token found. Please login again.');
        window.location.href = '/login';
        return;
    }
    
    // Remove trailing slash
    const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    
    // Construct SSO URL
    const ssoUrl = `${cleanAppUrl}/sso?token=${encodeURIComponent(token)}`;
    
    // Replace current window (NOT new tab)
    // This ensures single session context for proper logout
    window.location.href = ssoUrl;
}
```

### Why Replace Window Instead of New Tab?

**Problem with New Tabs:**
- Each tab has its own session context
- Logging out from one tab doesn't affect others
- Portal tab remains logged in
- Confusing user experience

**Solution with Window Replacement:**
- Single session context
- Logout affects the entire flow
- User can use "Back to Portal" button to navigate
- Clear and consistent experience

### Complete Logout Example

```typescript
// src/auth/AuthProvider.tsx
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    
    // Initialize from localStorage
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    setUser(decoded);
                } else {
                    localStorage.removeItem('access_token');
                }
            } catch (e) {
                localStorage.removeItem('access_token');
            }
        }
    }, []);
    
    // Listen for cross-tab logout
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'logout-event') {
                localStorage.removeItem('access_token');
                setUser(null);
                window.location.href = '/login';
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    
    const logout = () => {
        // Clear local token
        localStorage.removeItem('access_token');
        setUser(null);
        
        // Trigger cross-tab logout
        localStorage.setItem('logout-event', Date.now().toString());
        
        // Redirect to portal logout
        window.location.href = 'https://localhost:7140/logout';
    };
    
    return (
        <AuthContext.Provider value={{ user, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
```

### Testing Centralized Logout

1. **Login to Portal**
   - Go to `https://localhost:7140`
   - Login with credentials

2. **Launch App**
   - Click "Launch App"
   - Portal window is replaced with app

3. **Click Logout in App**
   - Observe redirect chain
   - Should end at portal login page

4. **Verify Complete Logout**
   - Portal shows login page
   - App shows login page
   - All tokens cleared

### Logout Checklist

- [ ] Logout clears localStorage token
- [ ] Logout triggers cross-tab event
- [ ] Logout redirects to portal `/logout`
- [ ] Portal clears session cookies
- [ ] Portal calls end_session endpoint
- [ ] DoorAuth clears server session
- [ ] User redirected to portal home
- [ ] "Back to Portal" button available

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| App card not showing | Check `appUrl` is set in database |
| Token not received | Verify portal is passing token correctly |
| Token validation fails | Check token signature and expiry |
| CORS errors | Add app URL to CORS whitelist |
| Infinite redirect loop | Ensure token is cleaned from URL after use |
| **Logout doesn't work** | **Ensure portal URL is correct in logout redirect** |
| **Still logged in after logout** | **Check if using new tabs instead of window replacement** |
| **Portal remains logged in** | **Verify `/logout` endpoint exists in DoorAuthSample** |
| **Logout redirects to wrong URL** | **Check `post_logout_redirect_uri` in portal config** |
| **Cross-tab logout not working** | **Verify localStorage event listener is implemented** |

---

## 📚 Summary

**SSO Portal Pattern Benefits:**
- ✅ **Single login** for all apps
- ✅ **Centralized app management**
- ✅ **Better user experience**
- ✅ **Easier access control**
- ✅ **Consistent authentication**

**Key Components:**
1. **DoorAuthSample** - Central portal/dashboard
2. **DoorAuth Server** - Authentication service
3. **Your Apps** - Receive and validate SSO tokens

**Next Steps:**
- Implement refresh token support
- Add role-based app visibility
- Enhance portal UI
- Add app analytics

---

**Created:** 2025-12-30  
**Version:** 2.0 - SSO Portal Pattern  
**Author:** DoorAuth Team
