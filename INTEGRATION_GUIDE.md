# Central Authentication System - Integration & Architecture Guide

## 1. Core Concepts
This system acts as a **Central Identity Provider (IdP)**. It manages "who is who" (Authentication) and "who can do what" (Authorization).

*   **Tenant:** An organization or customer isolated from others.
*   **Application (Client):** Software that relies on the IdP for login (e.g., HR Portal, Mobile App).
*   **User:** An identity belonging to a Tenant.
*   **Scope/Permission:** Granular rights (e.g., `payroll:read`) granted to a user for an application.

---

## 2. Security & Data Management

### 2.1 Password Management
We adhere to **NIST Digital Identity Guidelines**.
*   **Storage:** Passwords are **never** stored in plain text. We use **Bcrypt** (salt rounds >= 10) to hash them.
*   **Policy:**
    *   Minimum 8 characters.
    *   Must contain uppercase, lowercase, number, and special character.
*   **Reset Flow:** Secure, time-limited token sent via Email/SMS. Token is invalidated immediately after use.

### 2.2 Audit Logging (Event Trails)
Every critical action is immutable and logged.
*   **What is logged:** Login successes/failures, Password changes, Role updates, Menu modifications.
*   **Data Point:** `[Timestamp] [TenantID] [UserID] [Action] [Resource] [IP Address]`
*   **Usage:** Security audits, debugging, and compliance reports.

---

## 3. Integration Guide: "Plug and Play"

How to connect an external application (Client) to this Central System.

### Step 1: Registration (Admin Panel)
Before code, the application must be registered in the Central Auth Dashboard.
1.  **Create App:** Admin defines the app (e.g., "Finance Module").
2.  **Redirect URI:** Register the allowed return URL (e.g., `https://finance-app.com/callback`).
3.  **Credentials:** The system issues:
    *   **Client ID:** `(Public UUID)`
    *   **Client Secret:** `(Private Key - Keep Secure!)`

### Step 2: Configuration (Client Side)
The developer configures their standard OIDC/OAuth2 library.

**Example (.NET / appsettings.json):**
```json
"Authentication": {
  "Authority": "https://your-central-auth-system.com",
  "ClientId": "YOUR_CLIENT_ID",
  "ClientSecret": "YOUR_CLIENT_SECRET",
  "ResponseType": "code",
  "SaveTokens": true
}
```

**Example (Node.js / Passport):**
```javascript
new OIDCStrategy({
    issuer: 'https://your-central-auth-system.com',
    clientID: 'YOUR_CLIENT_ID',
    clientSecret: 'YOUR_CLIENT_SECRET',
    callbackURL: 'https://client-app.com/callback',
    scope: 'openid profile email'
})
```

### Step 3: The Authentication Flow (Runtime)

1.  **User Clicks Login:**
    *   Client App redirects user browser to:
    *   `GET /authorize?client_id=...&redirect_uri=...&response_type=code`
2.  **Central System Takes Over:**
    *   User sees the Central Login Page.
    *   User enters credentials -> System verifies Hash.
    *   **2FA Challenge:** System asks for TOTP (Google Auth) or SMS Code if enabled.
3.  **Grant Access:**
    *   System verifies identity.
    *   System checks if User is allowed to access this specific App.
4.  **Redirect Back:**
    *   System sends user back to `redirect_uri` with a temporary `code`.
5.  **Token Exchange:**
    *   Client App server sends `code` + `client_secret` to Central System (`POST /token`).
    *   Central System validates and returns **Access Token (JWT)**.

---

## 4. Authorization & Menus (The Custom Part)

Once the Client App has the **Access Token**, it knows *who* the user is. Now it needs to know *what* to show.

### 4.1 Fetching Menus
The Client App calls the Central API to get the dynamic navigation structure.

*   **Request:** `GET https://central-auth.com/api/v1/my-menus`
*   **Header:** `Authorization: Bearer <ACCESS_TOKEN>`
*   **Response:**
    ```json
    [
      {
        "label": "Dashboard",
        "path": "/dashboard",
        "icon": "home"
      },
      {
        "label": "Employees",
        "path": "/employees",
        "children": [
            { "label": "Add New", "path": "/employees/new" }
        ]
      }
    ]
    ```

### 4.2 Handling Permissions (Scopes)
The **Access Token** contains the user's permissions.
*   **Payload:** `scope: "openid profile payroll:read payroll:write"`
*   **Frontend:** "If `scope` includes `payroll:write`, show the 'Save' button."
*   **Backend:** "If `scope` is missing `payroll:write`, reject the `POST` request."
