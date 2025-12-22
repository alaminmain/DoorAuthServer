# System Architecture & Flow Diagrams

## 1. Overall System Architecture
High-level view of how the Central Auth System acts as the hub for all Tenants and Applications.

```mermaid
graph TD
    User((User))
    
    subgraph "External Clients (Tenants)"
        HR_App[HR System (.NET)]
        Payroll_App[Payroll System (Python)]
        Mobile_App[Mobile App (Flutter)]
    end

    subgraph "Central Identity Provider"
        Auth_Core[Auth Core API]
        Admin_Panel[Admin Dashboard (React)]
        DB[(Database)]
    end

    User -->|Access| HR_App
    User -->|Access| Payroll_App
    
    HR_App -->|Redirects for Login| Auth_Core
    Payroll_App -->|Redirects for Login| Auth_Core
    
    Auth_Core -->|Reads/Writes| DB
    Admin_Panel -->|Manages| Auth_Core
```

---

## 2. User -> HR System (SSO Login Flow)
Sequence of events when a user tries to access the HR System.

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant HR_App as HR System (Client)
    participant Auth_Sys as Central Auth System
    participant DB as Database

    User->>Browser: Opens https://hr-app.com
    Browser->>HR_App: GET /dashboard
    HR_App-->>Browser: 302 Redirect to https://auth-sys.com/authorize?client_id=HR...
    
    Browser->>Auth_Sys: GET /authorize...
    Auth_Sys->>User: Show Login Page
    User->>Auth_Sys: Enter Credentials (User/Pass)
    
    Auth_Sys->>DB: Validate User
    DB-->>Auth_Sys: User Valid
    
    Auth_Sys->>User: Show 2FA Challenge (if enabled)
    User->>Auth_Sys: Enter TOTP Code
    
    Auth_Sys-->>Browser: 302 Redirect to https://hr-app.com/callback?code=XYZ
    
    Browser->>HR_App: GET /callback?code=XYZ
    HR_App->>Auth_Sys: POST /token (Exchange Code for Token)
    Auth_Sys-->>HR_App: Return { access_token: "JWT..." }
    
    HR_App-->>Browser: Login Successful (Set Session Cookie)
    Browser->>User: Show HR Dashboard
```

---

## 3. Authorization & Menu Generation Process
How the system decides what the user sees after they are logged in.

```mermaid
sequenceDiagram
    actor User
    participant Client_App as HR System
    participant Auth_API as Central Auth API
    participant DB as Database

    Note over Client_App: User is Logged In (Has JWT)
    
    Client_App->>Auth_API: GET /api/v1/my-menus (Header: Bearer JWT)
    
    Auth_API->>Auth_API: Verify JWT Signature
    Auth_API->>Auth_API: Extract UserID & Roles from JWT
    
    Auth_API->>DB: Query Menus for Application "HR System"
    DB-->>Auth_API: Returns Full Menu Tree
    
    loop Filter Menus
        Auth_API->>Auth_API: Check if User.Roles has required Permission for Menu Item
        Note right of Auth_API: If Menu requires "payroll:read" <br/>and User doesn't have it, remove node.
    end
    
    Auth_API-->>Client_App: Return Filtered JSON Menu Tree
    
    Client_App->>User: Render Sidebar based on JSON
```

---

## 4. Internal Data Flow (Permission Check)
Logic inside the API when a user tries to perform an action.

```mermaid
flowchart TD
    A[Request: POST /api/payroll/approve] --> B{Valid JWT?}
    B -- No --> C[Return 401 Unauthorized]
    B -- Yes --> D[Extract Scopes from JWT]
    D --> E{Scope includes 'payroll:approve'?}
    E -- No --> F[Return 403 Forbidden]
    E -- Yes --> G[Execute Business Logic]
```
