# AI Context & Project Roadmap: Multi-Tenant Identity & Authorization System

**Role:** Act as a Senior Full-Stack Architect and Developer.
**Objective:** Build a production-grade, self-hosted **Central Authentication & Authorization System** (IdP) that supports Multi-Tenancy, Plug-and-Play SSO (OIDC/OAuth2), RBAC, and Dynamic Menu Management.

---

## 1. Technology Stack & Conventions
*   **Monorepo Structure:**
    *   `/server`: Node.js (v18+), Express, TypeScript.
    *   `/admin-panel`: React (Vite), TypeScript, Material UI (MUI).
    *   `/demo-client`: React (Vite), TypeScript (simulating an external app).
*   **Database / ORM:**
    *   **Prisma ORM** with **SQLite** (Dev) / **PostgreSQL** (Prod).
    *   Strict schema enforcement.
*   **Authentication & Security:**
    *   **Passport.js** (Strategies: Local, JWT, Google, GitHub).
    *   **Speakeasy** + **QRCode** for 2FA (TOTP).
    *   **Bcrypt** for password hashing (NIST standards).
    *   **Standard OIDC Flow** (Authorize Code Grant) for SSO.
*   **API Design:**
    *   RESTful standards.
    *   Standard Response Wrapper: `{ success: boolean, data: any, message?: string }`.

---

## 2. Database Schema (Prisma Models)

**Conceptual Schema** - Use this to generate the `schema.prisma` file.

*   **Tenant:** `{ id (UUID), name, domain, brandingConfig (JSON), createdAt }`
*   **User:** `{ id (UUID), tenantId, email, passwordHash, isTwoFactorEnabled, twoFactorSecret, createdAt, updatedAt }`
*   **Application:** `{ id (UUID), tenantId, name, clientId (unique), clientSecret, redirectUris (String[]), createdAt }`
*   **Role:** `{ id (UUID), tenantId, name, description, isSystem (bool) }`
*   **Permission:** `{ id (UUID), roleId, resource (string), action (string) }` -> *Scope: "payroll:write"*
*   **Menu:** `{ id (UUID), applicationId, label, path, icon, parentId (self-ref), order, requiredPermission }`
*   **AuditLog:** `{ id (UUID), tenantId, userId, action, resource, ipAddress, userAgent, details (JSON), createdAt }`

---

## 3. Core Features Requirements

### 3.1 Authentication (The IdP Core)
*   **Login Flow:** Validate Email/Password -> Check 2FA -> Issue Session/Token.
*   **SSO Endpoint (`/authorize`):**
    1.  Validate `client_id` and `redirect_uri`.
    2.  Check if user is logged in (Session).
    3.  If yes, generate `auth_code` and redirect back.
    4.  If no, show Login Screen.
*   **Token Endpoint (`/token`):** Exchange `auth_code` for `access_token` (JWT).

### 3.2 Authorization & Management
*   **RBAC:** Middleware must check `User -> Roles -> Permissions`.
*   **Dynamic Menus:** API `GET /api/menus` must recurse through the Menu tree and filter items where the user lacks the `requiredPermission`.

---

## 4. Implementation Roadmap (Task Queue)

**Phase 1: Foundation (Backend)**
- [ ] **Init:** Configure `server` with TypeScript, Express, and Prisma.
- [ ] **DB:** Create `schema.prisma` with all models defined above and run migration.
- [ ] **Util:** Create helper for `ApiResponse` and `Logger`.

**Phase 2: Auth Engine**
- [ ] **Register/Login:** Implement API for User Creation and Session Login (JWT).
- [ ] **2FA:** Implement `generate-2fa-secret` and `verify-2fa-token`.
- [ ] **Middleware:** Create `authMiddleware` to protect routes.

**Phase 3: The SSO Protocol**
- [ ] **OIDC:** Implement `/oauth/authorize` (GET) logic.
- [ ] **OIDC:** Implement `/oauth/token` (POST) logic.
- [ ] **Demo:** Verify the flow with Postman or a simple script.

**Phase 4: Management APIs**
- [ ] **CRUD:** APIs for Tenants, Applications, and Roles.
- [ ] **Menu Builder:** API to Create/Update menu nodes (handling hierarchy).
- [ ] **Menu Retrieval:** The "Smart Menu" endpoint for end-users.

**Phase 5: Frontend (Admin Panel)**
- [ ] **Setup:** Install Material UI.
- [ ] **Auth:** Connect Login page to Backend.
- [ ] **Dash:** Build "Tenant Manager" and "App Manager" views.

---

## 5. Security Mandates
1.  **Secrets:** Never commit `.env`.
2.  **Validation:** Use `Zod` or `Joi` for all incoming request bodies.
3.  **Logs:** Audit every state-changing action (Create/Update/Delete).
