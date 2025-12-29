# Dashboard Implementation Plan

## Objective
Convert `DoorAuthSample` into a centralized **Application Dashboard**.
This dashboard will serve as the **Single Sign-On (SSO) Landing Page**, where users log in once and can access all their authorized applications (Vehicle Management, Todo App, etc.) without re-entering credentials.

## 1. Authentication & SSO Architecture
*   **Identity Provider:** DoorAuth Server (`https://localhost:3000`).
*   **Dashboard:** DoorAuthSample (`https://localhost:7140`).
*   **Client App:** Vehicle Management System (`https://localhost:7231`).
*   **Mechanism:**
    1.  User logs into **Dashboard**.
    2.  Dashboard maintains a valid OIDC Session (Cookies).
    3.  Dashboard displays available applications.
    4.  User clicks "Vehicle Management".
    5.  Browser navigates to `https://localhost:7231`.
    6.  `VehicleManagement` redirects to DoorAuth (`https://localhost:3000/authorize`).
    7.  DoorAuth detects existing session (from Step 1) and **automatically** redirects back with a token (SSO).
    8.  User enters Vehicle Management without login prompt.

## 2. Implementation Steps

### Phase 1: Convert DoorAuthSample to Dashboard
1.  **Rename/Retain:** Keep project as `DoorAuthSample` (or rename to `DoorAuthDashboard`), running on port `7140`.
2.  **UI Upgrade:**
    *   Create a clean, card-based layout using HTML/CSS.
    *   Display "My Apps" section.
    *   Show User Profile (Name, Email, Roles) prominently.
3.  **Application List:**
    *   Hardcode the list of apps initially (since we know them):
        *   **Vehicle Management:** `https://localhost:7231`
        *   **Todo App:** `https://localhost:5175`
        *   **Admin Panel:** `https://localhost:3000`
4.  **Auto-Redirect Logic:**
    *   Ensure the dashboard root `/` checks authentication.
    *   If not authenticated -> Redirect to Login.
    *   If authenticated -> Show Dashboard.

### Phase 2: Fix VehicleManagement Integration (CRITICAL)
For the SSO flow (Step 7 above) to work, `VehicleManagement` **must** accept the redirect callback. Currently, it fails with "Correlation Failed".
**Diagnosis:** The Middleware Pipeline order in `VehicleManagement` is incorrect, causing cookie issues.
**Fix:**
    *   Reorder `Program.cs` pipeline:
        1.  `UseStaticFiles` (Move up)
        2.  `UseRouting` (Add explicit)
        3.  `UseAuthentication`
        4.  `UseAuthorization`
        5.  `UseAntiforgery`

### Phase 3: Dynamic App Discovery (Backend & Frontend)
1.  **Backend:**
    *   Create endpoint `GET /api/users/me/applications`.
    *   Logic: Fetch applications linked to the user's assigned roles.
2.  **Frontend (Dashboard):**
    *   Call this endpoint on load.
    *   Dynamically render the Application Cards.

### Phase 4: Unified Logout
1.  **Backend:**
    *   Ensure `/api/oauth/revoke` or `/end-session` clears cookies.
2.  **Frontend:**
    *   Implement "Logout" button that redirects to `https://localhost:3000/api/oauth/revoke?post_logout_redirect_uri=...`.

### Phase 5: Testing
1.  Verify Dashboard Login (already working).
2.  Verify "Click to App" flow.
3.  Verify Silent Login on destination apps.
4.  Verify Dynamic App List displays correct apps for different users.
