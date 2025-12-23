# AI Context & Project Roadmap: Multi-Tenant Identity & Authorization System

**Role:** Act as a Senior Full-Stack Architect and Developer.
**Objective:** Build a production-grade, self-hosted **Central Authentication & Authorization System** (IdP) that supports Multi-Tenancy, Plug-and-Play SSO (OIDC/OAuth2), RBAC, and Dynamic Menu Management.

---

## 1. Technology Stack & Conventions

- **Monorepo Structure:**
  - `/server`: Node.js (v18+), Express, TypeScript.
  - `/admin-panel`: React (Vite), TypeScript, Material UI (MUI).
  - `/demo-client`: React (Vite), TypeScript (simulating an external app).
- **Database / ORM:**
  - **Prisma ORM** with **SQLite** (Dev) / **PostgreSQL** (Prod).
  - Strict schema enforcement.
- **Authentication & Security:**
  - **Passport.js** (Strategies: Local, JWT, Google, GitHub).
  - **Speakeasy** + **QRCode** for 2FA (TOTP).
  - **Bcrypt** for password hashing (NIST standards).
  - **Standard OIDC Flow** (Authorize Code Grant) for SSO.
- **API Design:**
  - RESTful standards.
  - Standard Response Wrapper: `{ success: boolean, data: any, message?: string }`.

---

## 2. Database Schema (Prisma Models)

**Conceptual Schema** - Use this to generate the `schema.prisma` file.

> **Note on Legacy Schema:** A legacy MSSQL schema (`UserDb.sql`) has been provided. It uses Integer IDs and lacks Multi-Tenancy. We will **not** use it as-is. Instead, we will use it as a reference domain model and migrate valid concepts/data into the new Multi-Tenant UUID-based structure defined below.

- **Tenant:** `{ id (UUID), name, domain, brandingConfig (JSON), createdAt }`
- **Application:** `{ id (UUID), tenantId, name, description, status (string), logoUrl, appUrl, clientId (unique), clientSecret, redirectUris (String[]), createdAt }`
- **User:** `{ id (UUID), tenantId, loginId (unique per tenant), userName, email (unique per tenant), passwordHash, companyName, companyAddress, designation, contact, isApproved (bool), isLocked (bool), isTwoFactorEnabled (bool), twoFactorSecret, lastLoginTime, passAttemptCount, isPassExpired (bool), createdAt, updatedAt }`
- **Role:** `{ id (UUID), tenantId, name, description, isSystem (bool), status (string), createdAt, updatedAt }`
- **UserRole:** (Join Table) `{ userId, roleId }`
- **Permission:** `{ id (UUID), roleId, resource (string), action (string) }` -> _e.g., resource="payroll", action="write", forming the scope "payroll:write"_
- **Menu:** `{ id (UUID), applicationId, label, path, icon, parentId (self-ref), order, requiredPermission (string) }` -> _`requiredPermission` links to a scope like "payroll:read"_
- **AuditLog:** `{ id (UUID), tenantId, userId, action, resource, ipAddress, userAgent, details (JSON), createdAt }`
- **PassToken:** `{ id (UUID), userId, token, remarks, isActive (bool), expireDate, tokenUsedDate }`

---

## 3. Core Features Requirements

### 3.1 Authentication (The IdP Core)

- **Login Flow:** Validate Email/Password -> Check 2FA -> Issue Session/Token.
- **SSO Endpoint (`/authorize`):**
  1.  Validate `client_id` and `redirect_uri`.
  2.  Check if user is logged in (Session).
  3.  If yes, generate `auth_code` and redirect back.
  4.  If no, show Login Screen.
- **Token Endpoint (`/token`):** Exchange `auth_code` for `access_token` (JWT).

### 3.2 Authorization & Management

- **RBAC:** Middleware must check `User -> Roles -> Permissions`.
- **Dynamic Menus:** API `GET /api/menus` must recurse through the Menu tree and filter items where the user lacks the `requiredPermission`.

---

## 4. Implementation Roadmap (Task Queue)

**Phase 1: Foundation (Backend)**

- [x] **Init:** Configure `server` with TypeScript, Express, and Prisma.
- [x] **DB Strategy:** Analyze `UserDb.sql`. Map legacy `APPLICATION`, `USER`, and `MENU` tables to the new schema.
- [x] **DB:** Create `schema.prisma` with all models defined above (ignoring legacy MSSQL specifics) and run migration (SQLite/Postgres).
- [x] **Util:** Create helper for `ApiResponse` and `Logger`.

**Phase 2: Auth Engine**

- [x] **Register/Login:** Implement API for User Creation and Session Login (JWT). **(Completed)**
- [x] **2FA:** Implement `generate-2fa-secret` and `verify-2fa-token`. **(Completed)**
- [x] **Middleware:** Create `authMiddleware` to protect routes. **(Completed)**
- [x] **Password Recovery:** Implement "Forgot Password" (generate `PassToken`) and "Reset Password" (validate token & update hash) endpoints. **(Completed)**
- [x] **Account Security:** Implement Brute Force protection (Lock account after N failed attempts). **(Completed)**
- [ ] **Social Auth:** Implement Passport strategies for Google/GitHub.

**Phase 3: The SSO Protocol**

- [x] **OIDC:** Implement `/oauth/authorize` (GET) logic (Support `response_type=code` and PKCE `code_challenge`). **(Completed)**
- [x] **OIDC:** Implement `/oauth/token` (POST) logic (Support `authorization_code` and `refresh_token` grants). **(Completed)**
- [x] **OIDC:** Implement `/userinfo` endpoint (Standard OIDC identity fetch). **(Completed)**
- [x] **Logout:** Implement `/logout` endpoint (Session destruction & Redirect). **(Completed - via /oauth/revoke)**
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
