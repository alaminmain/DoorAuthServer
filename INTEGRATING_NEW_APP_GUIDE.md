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

In your Accounting App code (Frontend), configure the OIDC client:

```typescript
export const authConfig = {
    authority: 'http://localhost:3000', // DoorAuth Server
    clientId: 'accounting-app-client',
    redirectUri: 'http://localhost:5176/callback', // Must match Step 1
    responseType: 'code',
    scope: 'openid profile email'
};
```

When a user logs in via DoorAuth and has the "Accountant" role, the token they receive will grant them access, and your app can query the **Menus API** (`/api/menus?applicationId=...`) to dynamically render the side navigation.
