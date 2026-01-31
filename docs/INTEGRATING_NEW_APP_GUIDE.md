# Integration Guide: Adding a New Application (e.g., Accounting App)

This tutorial guides you through adding a new "Accounting Application" to the DoorAuth system, including registering the app, defining permissions, creating menus, and assigning roles.

## Step 1: Register the Application

You need to tell DoorAuth about your new application so it can handle logins for it.

**Option A: Using a Script (Recommended)**
1.  Create a registration script (e.g., `server/scripts/register-accounting.ts`).
2.  Run the script:
    ```bash
    cd server
    npx ts-node scripts/register-accounting.ts
    ```
    *I have already created this script for you. You can run it now to see it in action.*

**Option B: Manual Database Entry**
You can also manually insert a record into the `Application` table with:
- `clientId`: Unique identifier (e.g., `accounting-app`)
- `clientSecret`: Secure secret
- `redirectUris`: Where to redirect after login (e.g., `http://localhost:5176/callback`)

## Step 2: Define System Permissions

If your app needs specific permissions (e.g., `accounting:read`), you must define them in the server configuration.

1.  Open `server/src/config/permissions.ts`.
2.  Add your new permissions to the `SYSTEM_PERMISSIONS` array:
    ```typescript
    export const SYSTEM_PERMISSIONS = [
        // ... existing
        { resource: 'accounting', action: 'read', description: 'View accounting data' },
        { resource: 'accounting', action: 'write', description: 'Manage accounting records' },
    ];
    ```
3.  **Restart the Server** for these changes to take effect.
    *I have already added these example permissions for you.*

## Step 3: Create App-Specific Roles

Now, create roles that allow access to these permissions.

1.  Login to **DoorAuth Admin** (`http://localhost:5173`).
2.  Go to **Roles & Permissions**.
3.  Click **New Role**.
4.  Fill in:
    - **Tenant**: Your tenant.
    - **Application**: Select **"Accounting App"** (created in Step 1).
    - **Name**: `Accountant`.
    - **Permissions**: You will now see `accounting` permissions in the list (if Step 2 was successful). Select `accounting:read` and `accounting:write`.
5.  Click **Create Role**.

## Step 4: Create Menus

You can define the menu structure for your new app dynamically.

1.  Go to **Menu Builder** (`/menus`).
2.  **Select Application**: Choose **"Accounting App"** from the dropdown at the top.
3.  Click **New Menu Item**.
4.  Define the menu:
    - **Label**: `Dashboard`
    - **Path**: `/dashboard`
    - **Order**: `1`
    - **Required Permission**: `accounting:read` (Optional, keeps it hidden from unauthorized users).
5.  Add more items (e.g., `Invoices`, `Ledger`). You can nest them by setting a "Parent".

## Step 5: Assign Users

1.  Go to **User Roles** (or created Users first if needed).
2.  Select a user (e.g., `Jane Doe`).
3.  Assign the **"Accountant"** role to them.

## Step 6: Configure Your Client App

Your client application needs to be configured to use DoorAuth for authentication. DoorAuth supports OpenID Connect (OIDC) Discovery, which allows your app to automatically discover all authentication endpoints.

### Discovery Endpoint
First, verify the discovery endpoint is accessible:
```bash
curl http://localhost:3000/.well-known/openid-configuration
```

### Option A: .NET Core / ASP.NET Core

1. **Install NuGet Package**:
```bash
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
```

2. **Configure in Program.cs**:
```csharp
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;

builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    // DoorAuth will auto-discover endpoints from /.well-known/openid-configuration
    options.Authority = "http://localhost:3000";
    
    // Your app credentials from Step 1
    options.ClientId = "accounting-app-client";
    options.ClientSecret = "accounting-secret-key";
    
    // OAuth flow settings
    options.ResponseType = "code";
    options.SaveTokens = true;
    options.GetClaimsFromUserInfoEndpoint = true;
    
    // Development only - disable HTTPS requirement
    options.RequireHttpsMetadata = false;
    
    // Requested scopes
    options.Scope.Clear();
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    
    // Map claims to .NET identity
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role"
    };
});

app.UseAuthentication();
app.UseAuthorization();
```

3. **Protect Your Endpoints**:
```csharp
[Authorize]
public class AccountingController : Controller
{
    public IActionResult Dashboard()
    {
        var userName = User.Identity?.Name;
        var email = User.FindFirst("email")?.Value;
        var roles = User.FindAll("role").Select(c => c.Value);
        
        return View();
    }
}
```

### Option B: JavaScript / React / Vue / Angular

1. **Install OIDC Client**:
```bash
npm install oidc-client-ts
```

2. **Configure Auth Service** (`src/auth/authConfig.ts`):
```typescript
import { UserManager } from 'oidc-client-ts';

export const authConfig = {
    authority: 'http://localhost:3000', // DoorAuth Server
    client_id: 'accounting-app-client',
    client_secret: 'accounting-secret-key', // Only for confidential clients
    redirect_uri: 'http://localhost:5176/callback',
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: 'http://localhost:5176',
    
    // PKCE for enhanced security
    code_challenge_method: 'S256'
};

const userManager = new UserManager(authConfig);

// Login
export const login = () => userManager.signinRedirect();

// Handle callback
export const handleCallback = () => userManager.signinRedirectCallback();

// Logout
export const logout = () => userManager.signoutRedirect();

// Get current user
export const getUser = () => userManager.getUser();
```

3. **Use in Components**:
```typescript
// Login button
<button onClick={login}>Login with DoorAuth</button>

// Protected route
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    getUser().then(setUser);
  }, []);
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

## Step 7: Access User Data and Menus

Once authenticated, your app receives tokens with user information:

### Access Token Claims
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "email": "user@example.com",
  "roles": ["Accountant"],
  "permissions": ["accounting:read", "accounting:write"],
  "type": "access_token"
}
```

### ID Token Claims
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "preferred_username": "john.doe@example.com"
}
```

### Fetch Dynamic Menus
Query the Menus API to get the menu structure for your app:

```typescript
const response = await fetch(
  `http://localhost:3000/api/menus/smart?applicationId=YOUR_APP_ID`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const menus = await response.json();
// Use menus to render navigation
```

The Smart Menu endpoint automatically filters menus based on the user's permissions!

## Troubleshooting

### Error: Unable to retrieve configuration
- Ensure DoorAuth server is running on port 3000
- Test: `curl http://localhost:3000/.well-known/openid-configuration`

### Error: Invalid client credentials
- Verify `clientId` and `clientSecret` match Step 1
- Check for typos or trailing spaces

### Error: Redirect URI mismatch
- Ensure `redirect_uri` in your config exactly matches the one registered in Step 1
- Include the protocol (http://) and port number

## Next Steps

1. **Test the Integration**: Try logging in with a user that has the "Accountant" role
2. **Implement Authorization**: Use the permissions in the access token to control feature access
3. **Fetch Menus**: Use the Smart Menu API to dynamically build your navigation
4. **Production**: Enable HTTPS and update configurations for production environment

For more details, see:
- [OIDC Integration Guide](docs/OIDC_INTEGRATION_GUIDE.md)
- [AI Integration Guide](AI_INTEGRATION_GUIDE.md)

