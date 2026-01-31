# User Registration Architecture Review
## DoorAuth Authentication System

**Document Version:** 1.0  
**Review Date:** 2026-01-21  
**Reviewer Role:** Senior Software Architect  
**Status:** Architectural Design & Recommendations

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Registration Workflow](#proposed-registration-workflow)
4. [Architectural Design](#architectural-design)
5. [Security Considerations](#security-considerations)
6. [Implementation Roadmap](#implementation-roadmap)
7. [API Specifications](#api-specifications)
8. [Database Schema Changes](#database-schema-changes)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

---

## 1. Executive Summary

### Current Challenge
The DoorAuth system currently allows users to self-register with a `tenantId`, which creates a security vulnerability and violates multi-tenant isolation principles. Users should not be able to select their own tenant or assign themselves roles.

### Proposed Solution
Implement a **three-tier approval workflow**:
1. **User Self-Registration** - Users register with basic information (no tenant/role selection)
2. **Admin Tenant Assignment** - System Admin assigns users to appropriate tenants
3. **Tenant Admin Role Assignment** - Tenant Admin assigns roles within their tenant scope

### Key Benefits
- ✅ **Enhanced Security**: Prevents unauthorized tenant access
- ✅ **Proper Multi-Tenancy**: Enforces tenant isolation at registration level
- ✅ **RBAC Compliance**: Follows industry-standard role assignment patterns
- ✅ **Audit Trail**: Complete tracking of user approval and assignment process
- ✅ **Scalability**: Supports enterprise-level user onboarding workflows

---

## 2. Current State Analysis

### 2.1 Existing Registration Flow

**Current Implementation** (`auth.service.ts` lines 18-90):

```typescript
async register(data: any, ipAddress?: string, userAgent?: string) {
  const { email, password, tenantId, userName } = data;
  
  // User provides tenantId directly ❌ SECURITY ISSUE
  const newUser = await prisma.user.create({
    data: {
      email,
      loginId: email,
      userName,
      passwordHash,
      tenantId,  // ❌ User-controlled tenant assignment
      isApproved: true,  // ❌ Auto-approved
      emailVerified: false,
    },
  });
}
```

### 2.2 Identified Issues

| Issue | Severity | Impact | Current State |
|-------|----------|--------|---------------|
| **User-Controlled Tenant Selection** | 🔴 Critical | Users can join any tenant | `tenantId` in request body |
| **Auto-Approval** | 🟡 High | No admin oversight | `isApproved: true` |
| **No Role Assignment Workflow** | 🟡 High | Users have no roles initially | Manual post-registration |
| **Missing Approval States** | 🟡 Medium | Binary approved/not approved | No pending state |
| **No Registration Request Tracking** | 🟡 Medium | No audit trail | No dedicated table |

### 2.3 Database Schema Analysis

**Current User Model** (`schema.prisma` lines 33-64):

```prisma
model User {
  id                 String    @id @default(uuid())
  loginId            String
  userName           String?
  email              String
  passwordHash       String
  isApproved         Boolean   @default(true)  // ❌ Defaults to true
  tenantId           String                     // ❌ Required at creation
  
  tenant         Tenant        @relation(...)
  roles          UserRole[]
  
  @@unique([tenantId, loginId])
  @@unique([tenantId, email])
}
```

**Issues:**
- `tenantId` is required at user creation
- `isApproved` defaults to `true`
- No concept of "pending" or "registration request" state
- No tracking of who approved the user or when

---

## 3. Proposed Registration Workflow

### 3.1 Three-Tier Approval Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION WORKFLOW                        │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1: Self-Registration (Public)
┌──────────────────────────────────────────────────────────────┐
│  User submits:                                                │
│  • Email                                                      │
│  • Password                                                   │
│  • Full Name                                                  │
│  • Company Name (optional)                                    │
│  • Contact Info (optional)                                    │
│                                                               │
│  System creates:                                              │
│  • RegistrationRequest (status: PENDING)                      │
│  • Email verification sent                                    │
│  • No User record yet                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
                            
PHASE 2: Admin Tenant Assignment (System Admin Only)
┌──────────────────────────────────────────────────────────────┐
│  Admin reviews:                                               │
│  • Registration requests                                      │
│  • User details                                               │
│  • Email verification status                                  │
│                                                               │
│  Admin actions:                                               │
│  • Approve/Reject request                                     │
│  • Assign to Tenant                                           │
│  • Optionally assign to Organization                          │
│                                                               │
│  System creates:                                              │
│  • User record (isApproved: false, tenantId: assigned)        │
│  • RegistrationRequest (status: TENANT_ASSIGNED)              │
│  • Notification to Tenant Admin                               │
└──────────────────────────────────────────────────────────────┘
                            ↓
                            
PHASE 3: Tenant Admin Role Assignment (Tenant Admin)
┌──────────────────────────────────────────────────────────────┐
│  Tenant Admin reviews:                                        │
│  • New users in their tenant                                  │
│  • User details and organization                              │
│                                                               │
│  Tenant Admin actions:                                        │
│  • Assign roles                                               │
│  • Assign to organization unit (if not done)                  │
│  • Approve user for tenant access                             │
│                                                               │
│  System updates:                                              │
│  • User (isApproved: true)                                    │
│  • UserRole assignments                                       │
│  • RegistrationRequest (status: COMPLETED)                    │
│  • Welcome email to user                                      │
└──────────────────────────────────────────────────────────────┘
                            ↓
                            
USER CAN NOW LOGIN
```

### 3.2 State Machine

```
Registration Request States:
┌─────────────┐
│   PENDING   │ ← Initial state after user registration
└──────┬──────┘
       │
       ├─→ REJECTED (by Admin) → END
       │
       ├─→ EMAIL_UNVERIFIED → (waiting for email verification)
       │
       ↓
┌─────────────────┐
│ TENANT_ASSIGNED │ ← Admin assigned tenant
└──────┬──────────┘
       │
       ├─→ REJECTED (by Tenant Admin) → END
       │
       ↓
┌─────────────┐
│  COMPLETED  │ ← Tenant Admin assigned roles & approved
└─────────────┘
       ↓
   USER ACTIVE
```

---

## 4. Architectural Design

### 4.1 New Database Models

#### 4.1.1 RegistrationRequest Model

```prisma
model RegistrationRequest {
  id                String                    @id @default(uuid())
  email             String                    @unique
  fullName          String
  companyName       String?
  contact           String?
  passwordHash      String
  
  // Status tracking
  status            RegistrationStatus        @default(PENDING)
  emailVerified     Boolean                   @default(false)
  emailVerifiedAt   DateTime?
  
  // Admin assignment
  assignedTenantId  String?
  assignedOrgId     String?
  assignedByAdminId String?
  assignedAt        DateTime?
  
  // Tenant admin approval
  approvedByTenantAdminId String?
  approvedAt        DateTime?
  
  // Rejection
  rejectedBy        String?
  rejectedAt        DateTime?
  rejectionReason   String?
  
  // Metadata
  ipAddress         String?
  userAgent         String?
  createdAt         DateTime                  @default(now())
  updatedAt         DateTime                  @updatedAt
  
  // Relations
  tenant            Tenant?                   @relation(fields: [assignedTenantId], references: [id])
  organization      Organization?             @relation(fields: [assignedOrgId], references: [id])
  createdUser       User?                     @relation("CreatedFromRequest")
  
  @@map("registration_requests")
}

enum RegistrationStatus {
  PENDING              // Initial state
  EMAIL_VERIFIED       // Email verified, waiting for admin
  TENANT_ASSIGNED      // Admin assigned tenant, waiting for tenant admin
  COMPLETED            // Fully approved and active
  REJECTED             // Rejected by admin or tenant admin
  EXPIRED              // Request expired (e.g., 30 days)
}
```

#### 4.1.2 User Model Updates

```prisma
model User {
  id                 String    @id @default(uuid())
  loginId            String
  userName           String?
  email              String
  passwordHash       String
  
  // Updated approval logic
  isApproved         Boolean   @default(false)  // ✅ Changed to false
  approvedBy         String?                    // ✅ Track who approved
  approvedAt         DateTime?                  // ✅ Track when approved
  
  // Tenant assignment (now optional initially)
  tenantId           String?                    // ✅ Made optional
  
  // Registration tracking
  registrationRequestId String? @unique         // ✅ Link to registration request
  
  // ... existing fields ...
  
  tenant                Tenant?                 @relation(...)
  registrationRequest   RegistrationRequest?    @relation("CreatedFromRequest", fields: [registrationRequestId], references: [id])
  
  @@unique([tenantId, loginId])
  @@unique([tenantId, email])
}
```

### 4.2 Service Layer Architecture

#### 4.2.1 RegistrationService

```typescript
/**
 * RegistrationService
 * Handles the complete user registration workflow
 */
export class RegistrationService {
  
  /**
   * PHASE 1: User Self-Registration
   * Creates a registration request without tenant assignment
   */
  async createRegistrationRequest(data: {
    email: string;
    password: string;
    fullName: string;
    companyName?: string;
    contact?: string;
  }, metadata: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<RegistrationRequestResponse>
  
  /**
   * Verify email from registration request
   */
  async verifyRegistrationEmail(token: string): Promise<void>
  
  /**
   * PHASE 2: Admin Tenant Assignment
   * System admin assigns pending request to a tenant
   */
  async assignTenantToRequest(
    requestId: string,
    adminUserId: string,
    assignment: {
      tenantId: string;
      organizationId?: string;
    }
  ): Promise<UserCreationResponse>
  
  /**
   * PHASE 3: Tenant Admin Role Assignment & Approval
   * Tenant admin assigns roles and approves user
   */
  async approveUserAndAssignRoles(
    userId: string,
    tenantAdminId: string,
    assignment: {
      roleIds: string[];
      organizationId?: string;
    }
  ): Promise<UserApprovalResponse>
  
  /**
   * Reject registration request
   */
  async rejectRegistrationRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void>
  
  /**
   * Get pending registration requests (Admin view)
   */
  async getPendingRequests(filters?: {
    status?: RegistrationStatus;
    emailVerified?: boolean;
  }): Promise<RegistrationRequest[]>
  
  /**
   * Get pending users for tenant admin approval
   */
  async getPendingUsersForTenant(
    tenantId: string
  ): Promise<User[]>
}
```

#### 4.2.2 Updated AuthService

```typescript
export class AuthService {
  /**
   * DEPRECATED: Old registration method
   * Redirects to new registration workflow
   */
  async register(data: any, ipAddress?: string, userAgent?: string) {
    // Log deprecation warning
    Logger.warn('Using deprecated register method. Use RegistrationService instead.');
    
    // Redirect to new workflow
    const registrationService = new RegistrationService();
    return registrationService.createRegistrationRequest(data, { ipAddress, userAgent });
  }
  
  /**
   * Login - Updated to check approval status
   */
  async login(credentials: any, ipAddress?: string, userAgent?: string) {
    // ... existing code ...
    
    // Enhanced approval check
    if (!user.isApproved) {
      // Check registration status
      const registrationRequest = await prisma.registrationRequest.findUnique({
        where: { id: user.registrationRequestId }
      });
      
      if (registrationRequest?.status === 'PENDING') {
        throw new Error('Your registration is pending admin approval.');
      } else if (registrationRequest?.status === 'TENANT_ASSIGNED') {
        throw new Error('Your account is pending role assignment by your tenant administrator.');
      } else {
        throw new Error('Account is not approved. Please contact your administrator.');
      }
    }
    
    // ... rest of login logic ...
  }
}
```

### 4.3 Controller Layer

#### 4.3.1 New RegistrationController

```typescript
export class RegistrationController {
  
  /**
   * POST /api/registration/request
   * Public endpoint for user self-registration
   */
  async createRequest(req: Request, res: Response): Promise<void>
  
  /**
   * POST /api/registration/verify-email
   * Verify email from registration request
   */
  async verifyEmail(req: Request, res: Response): Promise<void>
  
  /**
   * GET /api/registration/requests
   * Get pending registration requests (Admin only)
   * @permission system:admin
   */
  async getPendingRequests(req: Request, res: Response): Promise<void>
  
  /**
   * POST /api/registration/requests/:id/assign-tenant
   * Assign tenant to registration request (Admin only)
   * @permission system:admin
   */
  async assignTenant(req: Request, res: Response): Promise<void>
  
  /**
   * POST /api/registration/requests/:id/reject
   * Reject registration request (Admin only)
   * @permission system:admin
   */
  async rejectRequest(req: Request, res: Response): Promise<void>
  
  /**
   * GET /api/registration/pending-users
   * Get users pending role assignment (Tenant Admin only)
   * @permission tenant:admin
   */
  async getPendingUsers(req: Request, res: Response): Promise<void>
  
  /**
   * POST /api/registration/users/:id/approve
   * Approve user and assign roles (Tenant Admin only)
   * @permission tenant:admin
   */
  async approveUser(req: Request, res: Response): Promise<void>
}
```

### 4.4 Permission Model

```typescript
// New permissions required
const REGISTRATION_PERMISSIONS = {
  // System Admin permissions
  'registration:view_requests': 'View all registration requests',
  'registration:assign_tenant': 'Assign users to tenants',
  'registration:reject_request': 'Reject registration requests',
  
  // Tenant Admin permissions
  'user:view_pending': 'View pending users in tenant',
  'user:approve': 'Approve users in tenant',
  'user:assign_roles': 'Assign roles to users in tenant',
  'user:reject': 'Reject users in tenant',
};

// Role assignments
const ROLE_PERMISSIONS = {
  'System Admin': [
    'registration:view_requests',
    'registration:assign_tenant',
    'registration:reject_request',
    'tenant:create',
    'tenant:update',
    'tenant:delete',
  ],
  
  'Tenant Admin': [
    'user:view_pending',
    'user:approve',
    'user:assign_roles',
    'user:reject',
    'role:view',
    'role:assign',
    'organization:manage',
  ],
};
```

---

## 5. Security Considerations

### 5.1 Threat Model

| Threat | Mitigation | Priority |
|--------|------------|----------|
| **Unauthorized Tenant Access** | Remove tenant selection from registration | 🔴 Critical |
| **Self-Role Assignment** | Separate role assignment to Tenant Admin | 🔴 Critical |
| **Email Enumeration** | Generic responses for existing emails | 🟡 High |
| **Registration Spam** | Rate limiting + CAPTCHA | 🟡 High |
| **Privilege Escalation** | Strict permission checks on all endpoints | 🔴 Critical |
| **Data Leakage** | Filter responses by user permissions | 🟡 High |

### 5.2 Security Controls

#### 5.2.1 Rate Limiting

```typescript
// Registration endpoint rate limiting
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 registration attempts per IP
  message: 'Too many registration attempts. Please try again later.',
});

// Apply to registration endpoint
router.post('/api/registration/request', registrationLimiter, ...);
```

#### 5.2.2 Email Verification

```typescript
// Require email verification before admin review
async createRegistrationRequest(data: any) {
  // Create request
  const request = await prisma.registrationRequest.create({ ... });
  
  // Send verification email
  await emailService.sendVerificationEmail(request.email, request.id);
  
  // Admin can only see verified requests
  return {
    message: 'Registration request created. Please verify your email.',
    requestId: request.id,
  };
}
```

#### 5.2.3 Permission Middleware

```typescript
// Middleware to check registration permissions
export const requireRegistrationPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    // Check if user has permission
    const hasPermission = await permissionService.checkPermission(
      user.userId,
      permission
    );
    
    if (!hasPermission) {
      return res.status(403).json(
        ApiResponse.error('Insufficient permissions')
      );
    }
    
    next();
  };
};

// Usage
router.post(
  '/api/registration/requests/:id/assign-tenant',
  authenticate,
  requireRegistrationPermission('registration:assign_tenant'),
  registrationController.assignTenant
);
```

### 5.3 Audit Logging

```typescript
// Log all registration workflow actions
await auditLog.create({
  action: 'REGISTRATION_REQUEST_CREATED',
  resource: 'RegistrationRequest',
  resourceId: request.id,
  userId: null, // No user yet
  ipAddress,
  userAgent,
  details: {
    email: request.email,
    fullName: request.fullName,
  },
});

await auditLog.create({
  action: 'TENANT_ASSIGNED_TO_REQUEST',
  resource: 'RegistrationRequest',
  resourceId: request.id,
  userId: adminUserId,
  tenantId: tenantId,
  details: {
    requestEmail: request.email,
    assignedTenant: tenant.name,
  },
});

await auditLog.create({
  action: 'USER_APPROVED_BY_TENANT_ADMIN',
  resource: 'User',
  resourceId: user.id,
  userId: tenantAdminId,
  tenantId: user.tenantId,
  details: {
    assignedRoles: roleIds,
  },
});
```

---

## 6. Implementation Roadmap

### Phase 1: Database Schema Updates (Week 1)

**Tasks:**
1. Create `RegistrationRequest` model
2. Add `RegistrationStatus` enum
3. Update `User` model (make `tenantId` optional, add approval tracking)
4. Create migration scripts
5. Add indexes for performance

**Deliverables:**
- [ ] Prisma schema updated
- [ ] Migration files created
- [ ] Database migrated
- [ ] Seed data updated

**Estimated Effort:** 2-3 days

---

### Phase 2: Backend Services (Week 1-2)

**Tasks:**
1. Create `RegistrationService`
2. Update `AuthService` (deprecate old register method)
3. Create `RegistrationController`
4. Add permission definitions
5. Create middleware for permission checks
6. Add audit logging

**Deliverables:**
- [ ] RegistrationService implemented
- [ ] All endpoints created
- [ ] Permission checks in place
- [ ] Audit logging active
- [ ] Unit tests written

**Estimated Effort:** 4-5 days

---

### Phase 3: API Routes & Documentation (Week 2)

**Tasks:**
1. Create registration routes
2. Update Swagger/OpenAPI documentation
3. Add request/response DTOs
4. Add validation schemas
5. Update integration guide

**Deliverables:**
- [ ] Routes configured
- [ ] Swagger docs updated
- [ ] Validation in place
- [ ] Integration guide updated

**Estimated Effort:** 2-3 days

---

### Phase 4: Frontend - Admin Panel (Week 3)

**Tasks:**
1. Create Registration Requests dashboard (System Admin)
2. Create Pending Users dashboard (Tenant Admin)
3. Add tenant assignment UI
4. Add role assignment UI
5. Add approval/rejection workflows

**Deliverables:**
- [ ] Admin dashboards created
- [ ] Assignment UIs implemented
- [ ] Approval workflows functional
- [ ] User notifications implemented

**Estimated Effort:** 5-6 days

---

### Phase 5: Frontend - User Registration (Week 3-4)

**Tasks:**
1. Create public registration page
2. Add email verification flow
3. Add status checking page
4. Update login page with better error messages
5. Add user notifications

**Deliverables:**
- [ ] Registration page created
- [ ] Email verification flow working
- [ ] Status page implemented
- [ ] Login errors improved

**Estimated Effort:** 3-4 days

---

### Phase 6: Testing & QA (Week 4)

**Tasks:**
1. Unit tests for all services
2. Integration tests for workflows
3. E2E tests for complete flow
4. Security testing
5. Performance testing

**Deliverables:**
- [ ] 90%+ test coverage
- [ ] All workflows tested
- [ ] Security audit passed
- [ ] Performance benchmarks met

**Estimated Effort:** 4-5 days

---

### Phase 7: Documentation & Deployment (Week 5)

**Tasks:**
1. Update API documentation
2. Create admin user guide
3. Create user registration guide
4. Update deployment scripts
5. Production deployment

**Deliverables:**
- [ ] Complete documentation
- [ ] User guides published
- [ ] Deployment scripts ready
- [ ] Production deployed

**Estimated Effort:** 2-3 days

---

**Total Estimated Timeline:** 4-5 weeks

---

## 7. API Specifications

### 7.1 Public Registration Endpoints

#### POST /api/registration/request

**Description:** Create a new registration request (public endpoint)

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecureP@ss123",
  "fullName": "John Doe",
  "companyName": "Acme Corp",
  "contact": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "requestId": "uuid-here",
    "email": "john.doe@example.com",
    "status": "PENDING",
    "message": "Registration request created. Please check your email to verify your account."
  }
}
```

**Validation:**
- Email: Valid email format, unique
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- Full Name: Required, 2-100 chars
- Company Name: Optional, max 200 chars
- Contact: Optional, valid phone format

**Rate Limit:** 3 requests per 15 minutes per IP

---

#### POST /api/registration/verify-email

**Description:** Verify email from registration request

**Request:**
```json
{
  "token": "verification-token-here"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully. Your registration is now pending admin approval."
  }
}
```

---

#### GET /api/registration/status/:requestId

**Description:** Check registration request status (public, requires email verification)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "requestId": "uuid-here",
    "email": "john.doe@example.com",
    "status": "TENANT_ASSIGNED",
    "emailVerified": true,
    "createdAt": "2026-01-21T10:00:00Z",
    "message": "Your registration is pending role assignment by your tenant administrator."
  }
}
```

---

### 7.2 Admin Endpoints

#### GET /api/registration/requests

**Description:** Get all registration requests (System Admin only)

**Permission:** `registration:view_requests`

**Query Parameters:**
- `status`: Filter by status (PENDING, EMAIL_VERIFIED, etc.)
- `emailVerified`: Filter by email verification status
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "uuid-1",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "companyName": "Acme Corp",
        "contact": "+1234567890",
        "status": "EMAIL_VERIFIED",
        "emailVerified": true,
        "emailVerifiedAt": "2026-01-21T10:05:00Z",
        "createdAt": "2026-01-21T10:00:00Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

#### POST /api/registration/requests/:id/assign-tenant

**Description:** Assign tenant to registration request (System Admin only)

**Permission:** `registration:assign_tenant`

**Request:**
```json
{
  "tenantId": "tenant-uuid",
  "organizationId": "org-uuid" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "email": "john.doe@example.com",
    "tenantId": "tenant-uuid",
    "tenantName": "Acme Corporation",
    "status": "TENANT_ASSIGNED",
    "message": "User created and assigned to tenant. Tenant admin can now assign roles."
  }
}
```

**Side Effects:**
- Creates User record
- Updates RegistrationRequest status to TENANT_ASSIGNED
- Sends notification to Tenant Admin
- Creates audit log entry

---

#### POST /api/registration/requests/:id/reject

**Description:** Reject registration request (System Admin only)

**Permission:** `registration:reject_request`

**Request:**
```json
{
  "reason": "Invalid company information provided"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Registration request rejected successfully."
  }
}
```

**Side Effects:**
- Updates RegistrationRequest status to REJECTED
- Sends rejection email to user
- Creates audit log entry

---

### 7.3 Tenant Admin Endpoints

#### GET /api/registration/pending-users

**Description:** Get users pending role assignment in tenant (Tenant Admin only)

**Permission:** `user:view_pending`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "email": "john.doe@example.com",
        "userName": "John Doe",
        "companyName": "Acme Corp",
        "contact": "+1234567890",
        "organizationId": "org-uuid",
        "organizationName": "Sales Department",
        "isApproved": false,
        "createdAt": "2026-01-21T11:00:00Z",
        "assignedByAdmin": "admin@system.com",
        "assignedAt": "2026-01-21T11:00:00Z"
      }
    ]
  }
}
```

---

#### POST /api/registration/users/:id/approve

**Description:** Approve user and assign roles (Tenant Admin only)

**Permission:** `user:approve`, `user:assign_roles`

**Request:**
```json
{
  "roleIds": ["role-uuid-1", "role-uuid-2"],
  "organizationId": "org-uuid" // Optional, if not already assigned
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "user-uuid",
    "email": "john.doe@example.com",
    "isApproved": true,
    "roles": [
      {
        "id": "role-uuid-1",
        "name": "Employee"
      },
      {
        "id": "role-uuid-2",
        "name": "Viewer"
      }
    ],
    "message": "User approved successfully. Welcome email sent."
  }
}
```

**Side Effects:**
- Updates User.isApproved to true
- Creates UserRole assignments
- Updates RegistrationRequest status to COMPLETED
- Sends welcome email to user
- Creates audit log entry

---

## 8. Database Schema Changes

### 8.1 Migration Script

```sql
-- Migration: Add Registration Request System
-- Version: 001_add_registration_requests
-- Date: 2026-01-21

-- Create RegistrationStatus enum
CREATE TYPE "RegistrationStatus" AS ENUM (
  'PENDING',
  'EMAIL_VERIFIED',
  'TENANT_ASSIGNED',
  'COMPLETED',
  'REJECTED',
  'EXPIRED'
);

-- Create RegistrationRequest table
CREATE TABLE "registration_requests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "full_name" TEXT NOT NULL,
  "company_name" TEXT,
  "contact" TEXT,
  "password_hash" TEXT NOT NULL,
  
  -- Status tracking
  "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "email_verified_at" TIMESTAMP,
  
  -- Admin assignment
  "assigned_tenant_id" TEXT,
  "assigned_org_id" TEXT,
  "assigned_by_admin_id" TEXT,
  "assigned_at" TIMESTAMP,
  
  -- Tenant admin approval
  "approved_by_tenant_admin_id" TEXT,
  "approved_at" TIMESTAMP,
  
  -- Rejection
  "rejected_by" TEXT,
  "rejected_at" TIMESTAMP,
  "rejection_reason" TEXT,
  
  -- Metadata
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  CONSTRAINT "fk_assigned_tenant" FOREIGN KEY ("assigned_tenant_id") 
    REFERENCES "tenants"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_assigned_org" FOREIGN KEY ("assigned_org_id") 
    REFERENCES "organizations"("id") ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX "idx_registration_requests_status" ON "registration_requests"("status");
CREATE INDEX "idx_registration_requests_email_verified" ON "registration_requests"("email_verified");
CREATE INDEX "idx_registration_requests_assigned_tenant" ON "registration_requests"("assigned_tenant_id");
CREATE INDEX "idx_registration_requests_created_at" ON "registration_requests"("created_at");

-- Update Users table
ALTER TABLE "users" 
  ADD COLUMN "approved_by" TEXT,
  ADD COLUMN "approved_at" TIMESTAMP,
  ADD COLUMN "registration_request_id" TEXT UNIQUE,
  ALTER COLUMN "is_approved" SET DEFAULT false,
  ALTER COLUMN "tenant_id" DROP NOT NULL;

-- Add foreign key for registration request
ALTER TABLE "users"
  ADD CONSTRAINT "fk_registration_request" 
  FOREIGN KEY ("registration_request_id") 
  REFERENCES "registration_requests"("id") 
  ON DELETE SET NULL;

-- Create index
CREATE INDEX "idx_users_registration_request" ON "users"("registration_request_id");

-- Update existing users to maintain data integrity
UPDATE "users" 
SET "is_approved" = true, 
    "approved_at" = "created_at"
WHERE "is_approved" = true;
```

### 8.2 Rollback Script

```sql
-- Rollback: Remove Registration Request System
-- Version: 001_add_registration_requests_rollback

-- Remove foreign key from users
ALTER TABLE "users" DROP CONSTRAINT "fk_registration_request";

-- Remove new columns from users
ALTER TABLE "users" 
  DROP COLUMN "approved_by",
  DROP COLUMN "approved_at",
  DROP COLUMN "registration_request_id",
  ALTER COLUMN "is_approved" SET DEFAULT true,
  ALTER COLUMN "tenant_id" SET NOT NULL;

-- Drop registration_requests table
DROP TABLE "registration_requests";

-- Drop enum
DROP TYPE "RegistrationStatus";
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('RegistrationService', () => {
  describe('createRegistrationRequest', () => {
    it('should create a registration request with PENDING status', async () => {
      const result = await registrationService.createRegistrationRequest({
        email: 'test@example.com',
        password: 'SecureP@ss123',
        fullName: 'Test User',
      }, {});
      
      expect(result.status).toBe('PENDING');
      expect(result.emailVerified).toBe(false);
    });
    
    it('should reject duplicate email addresses', async () => {
      await expect(
        registrationService.createRegistrationRequest({
          email: 'existing@example.com',
          password: 'SecureP@ss123',
          fullName: 'Test User',
        }, {})
      ).rejects.toThrow('Email already registered');
    });
    
    it('should hash password before storing', async () => {
      const result = await registrationService.createRegistrationRequest({
        email: 'test@example.com',
        password: 'SecureP@ss123',
        fullName: 'Test User',
      }, {});
      
      const request = await prisma.registrationRequest.findUnique({
        where: { id: result.requestId }
      });
      
      expect(request.passwordHash).not.toBe('SecureP@ss123');
      expect(await bcrypt.compare('SecureP@ss123', request.passwordHash)).toBe(true);
    });
  });
  
  describe('assignTenantToRequest', () => {
    it('should create user and update request status', async () => {
      const request = await createTestRegistrationRequest();
      
      const result = await registrationService.assignTenantToRequest(
        request.id,
        'admin-user-id',
        { tenantId: 'tenant-id' }
      );
      
      expect(result.userId).toBeDefined();
      expect(result.tenantId).toBe('tenant-id');
      
      const updatedRequest = await prisma.registrationRequest.findUnique({
        where: { id: request.id }
      });
      expect(updatedRequest.status).toBe('TENANT_ASSIGNED');
    });
    
    it('should reject if email not verified', async () => {
      const request = await createTestRegistrationRequest({ emailVerified: false });
      
      await expect(
        registrationService.assignTenantToRequest(
          request.id,
          'admin-user-id',
          { tenantId: 'tenant-id' }
        )
      ).rejects.toThrow('Email must be verified');
    });
  });
  
  describe('approveUserAndAssignRoles', () => {
    it('should approve user and assign roles', async () => {
      const user = await createTestUserPendingApproval();
      
      const result = await registrationService.approveUserAndAssignRoles(
        user.id,
        'tenant-admin-id',
        { roleIds: ['role-1', 'role-2'] }
      );
      
      expect(result.isApproved).toBe(true);
      expect(result.roles).toHaveLength(2);
      
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { roles: true }
      });
      expect(updatedUser.isApproved).toBe(true);
      expect(updatedUser.roles).toHaveLength(2);
    });
  });
});
```

### 9.2 Integration Tests

```typescript
describe('Registration Workflow Integration', () => {
  it('should complete full registration workflow', async () => {
    // Phase 1: User registration
    const registrationResponse = await request(app)
      .post('/api/registration/request')
      .send({
        email: 'newuser@example.com',
        password: 'SecureP@ss123',
        fullName: 'New User',
        companyName: 'Test Corp'
      });
    
    expect(registrationResponse.status).toBe(201);
    const requestId = registrationResponse.body.data.requestId;
    
    // Verify email
    const verificationToken = await getVerificationToken(requestId);
    await request(app)
      .post('/api/registration/verify-email')
      .send({ token: verificationToken });
    
    // Phase 2: Admin assigns tenant
    const assignResponse = await request(app)
      .post(`/api/registration/requests/${requestId}/assign-tenant`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tenantId: testTenantId });
    
    expect(assignResponse.status).toBe(200);
    const userId = assignResponse.body.data.userId;
    
    // Phase 3: Tenant admin assigns roles and approves
    const approveResponse = await request(app)
      .post(`/api/registration/users/${userId}/approve`)
      .set('Authorization', `Bearer ${tenantAdminToken}`)
      .send({ roleIds: [employeeRoleId] });
    
    expect(approveResponse.status).toBe(200);
    
    // Verify user can now login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@example.com',
        password: 'SecureP@ss123'
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toBeDefined();
  });
});
```

### 9.3 E2E Tests

```typescript
describe('Registration E2E Flow', () => {
  it('should handle complete user journey from registration to login', async () => {
    // User visits registration page
    await page.goto('https://localhost:3000/register');
    
    // Fill registration form
    await page.fill('[name="email"]', 'e2euser@example.com');
    await page.fill('[name="password"]', 'SecureP@ss123');
    await page.fill('[name="fullName"]', 'E2E Test User');
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('.success-message')).toContainText('Please verify your email');
    
    // Admin logs in and assigns tenant
    await page.goto('https://localhost:3000/login');
    await loginAsAdmin(page);
    await page.goto('https://localhost:3000/admin/registration-requests');
    await page.click(`[data-request-email="e2euser@example.com"] .assign-tenant-btn`);
    await page.selectOption('[name="tenantId"]', testTenantId);
    await page.click('.confirm-assign-btn');
    
    // Tenant admin logs in and approves
    await page.goto('https://localhost:3000/login');
    await loginAsTenantAdmin(page);
    await page.goto('https://localhost:3000/tenant-admin/pending-users');
    await page.click(`[data-user-email="e2euser@example.com"] .approve-btn`);
    await page.check('[data-role="Employee"]');
    await page.click('.confirm-approve-btn');
    
    // User can now login
    await page.goto('https://localhost:3000/login');
    await page.fill('[name="email"]', 'e2euser@example.com');
    await page.fill('[name="password"]', 'SecureP@ss123');
    await page.click('button[type="submit"]');
    
    // Verify successful login
    await expect(page).toHaveURL('https://localhost:3000/dashboard');
  });
});
```

---

## 10. Deployment Considerations

### 10.1 Migration Strategy

**Option 1: Big Bang Migration (Recommended for Development)**
- Deploy all changes at once
- Migrate existing users to new schema
- Update all clients simultaneously

**Option 2: Phased Migration (Recommended for Production)**
1. **Phase 1:** Deploy database schema changes (backward compatible)
2. **Phase 2:** Deploy backend with feature flag (disabled)
3. **Phase 3:** Deploy frontend (old flow still works)
4. **Phase 4:** Enable feature flag for new registrations
5. **Phase 5:** Migrate existing pending users
6. **Phase 6:** Remove old registration endpoint

### 10.2 Data Migration

```typescript
/**
 * Migrate existing users to new approval system
 */
async function migrateExistingUsers() {
  // All existing users are already approved
  await prisma.user.updateMany({
    where: {
      isApproved: true,
      approvedAt: null,
    },
    data: {
      approvedAt: new Date(),
      approvedBy: 'SYSTEM_MIGRATION',
    },
  });
  
  Logger.info('Migrated existing users to new approval system');
}
```

### 10.3 Environment Variables

```bash
# Registration settings
REGISTRATION_ENABLED=true
REGISTRATION_REQUIRE_EMAIL_VERIFICATION=true
REGISTRATION_REQUEST_EXPIRY_DAYS=30

# Email settings for registration
REGISTRATION_EMAIL_FROM=noreply@doorauth.com
REGISTRATION_EMAIL_SUBJECT=Verify Your Email - DoorAuth

# Admin notification settings
ADMIN_NOTIFICATION_EMAIL=admin@doorauth.com
TENANT_ADMIN_NOTIFICATION_ENABLED=true
```

### 10.4 Monitoring & Alerts

```typescript
// Metrics to track
const REGISTRATION_METRICS = {
  'registration.requests.created': 'Counter',
  'registration.requests.verified': 'Counter',
  'registration.requests.assigned': 'Counter',
  'registration.requests.approved': 'Counter',
  'registration.requests.rejected': 'Counter',
  'registration.requests.pending.gauge': 'Gauge',
  'registration.workflow.duration': 'Histogram',
};

// Alerts
const REGISTRATION_ALERTS = {
  'High Pending Requests': {
    condition: 'pending_requests > 100',
    severity: 'warning',
    notification: 'email',
  },
  'Registration Failure Rate': {
    condition: 'failure_rate > 0.1',
    severity: 'critical',
    notification: 'pagerduty',
  },
};
```

---

## Appendix A: Comparison with Industry Standards

### Auth0
- ✅ Similar: Separate user invitation flow
- ✅ Similar: Admin-controlled tenant assignment
- ❌ Different: Auth0 uses "invitations" instead of "registration requests"

### Okta
- ✅ Similar: Multi-step approval process
- ✅ Similar: Role assignment by tenant admin
- ✅ Similar: Email verification required

### Azure AD B2C
- ✅ Similar: Self-service registration with approval
- ✅ Similar: Admin-controlled tenant assignment
- ❌ Different: Azure uses "sign-up policies" for customization

**Conclusion:** Our proposed architecture aligns with industry best practices and follows patterns used by major identity providers.

---

## Appendix B: FAQ

**Q: Can users still register without admin approval?**  
A: No. All registrations now require admin approval and tenant assignment.

**Q: What happens to existing users?**  
A: Existing users are automatically migrated with `isApproved: true` and `approvedAt` set to their creation date.

**Q: Can a user belong to multiple tenants?**  
A: No. Each user belongs to exactly one tenant. For multi-tenant access, create separate user accounts.

**Q: How long do registration requests remain valid?**  
A: Registration requests expire after 30 days (configurable). Expired requests can be manually reviewed by admins.

**Q: Can tenant admins reject users?**  
A: Yes. Tenant admins can reject users assigned to their tenant, with a reason.

**Q: What notifications are sent?**  
A:
- User: Email verification, approval confirmation, rejection notice
- Admin: New registration request (if configured)
- Tenant Admin: New user assigned to tenant

**Q: Can this be disabled for specific tenants?**  
A: Yes. A feature flag can be added per tenant to allow auto-approval for specific use cases.

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Senior Software Architect** | [Your Name] | _________ | 2026-01-21 |
| **Lead Backend Developer** | _________ | _________ | _________ |
| **Security Engineer** | _________ | _________ | _________ |
| **Product Owner** | _________ | _________ | _________ |

---

**End of Document**
