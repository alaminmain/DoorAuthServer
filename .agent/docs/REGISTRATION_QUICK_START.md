# Registration Workflow - Quick Start Guide

## 🎯 Overview

This guide provides a **step-by-step walkthrough** for implementing the new three-tier registration workflow in DoorAuth. Follow this guide if you want to start implementing immediately.

**Related Documents:**
- 📋 [Full Architecture Review](./REGISTRATION_ARCHITECTURE_REVIEW.md)
- ✅ [Implementation Checklist](./REGISTRATION_IMPLEMENTATION_CHECKLIST.md)
- 🎨 [Workflow Diagram](../artifacts/registration_workflow_diagram.png)

---

## 🚀 Quick Implementation Path

### Step 1: Update Database Schema (30 minutes)

**1.1 Update `schema.prisma`**

Add the following to your `schema.prisma` file:

```prisma
// Add this enum at the top level
enum RegistrationStatus {
  PENDING
  EMAIL_VERIFIED
  TENANT_ASSIGNED
  COMPLETED
  REJECTED
  EXPIRED
}

// Add this new model
model RegistrationRequest {
  id                      String              @id @default(uuid())
  email                   String              @unique
  fullName                String
  companyName             String?
  contact                 String?
  passwordHash            String
  
  // Status tracking
  status                  RegistrationStatus  @default(PENDING)
  emailVerified           Boolean             @default(false)
  emailVerifiedAt         DateTime?
  
  // Admin assignment
  assignedTenantId        String?
  assignedOrgId           String?
  assignedByAdminId       String?
  assignedAt              DateTime?
  
  // Tenant admin approval
  approvedByTenantAdminId String?
  approvedAt              DateTime?
  
  // Rejection
  rejectedBy              String?
  rejectedAt              DateTime?
  rejectionReason         String?
  
  // Metadata
  ipAddress               String?
  userAgent               String?
  createdAt               DateTime            @default(now())
  updatedAt               DateTime            @updatedAt
  
  // Relations
  tenant                  Tenant?             @relation(fields: [assignedTenantId], references: [id])
  organization            Organization?       @relation(fields: [assignedOrgId], references: [id])
  createdUser             User?               @relation("CreatedFromRequest")
  
  @@map("registration_requests")
}

// Update the User model - add these fields
model User {
  // ... existing fields ...
  
  // NEW FIELDS - Add these
  isApproved              Boolean             @default(false)  // Changed from true
  approvedBy              String?
  approvedAt              DateTime?
  registrationRequestId   String?             @unique
  
  // NEW RELATION - Add this
  registrationRequest     RegistrationRequest? @relation("CreatedFromRequest", fields: [registrationRequestId], references: [id])
  
  // ... rest of existing fields ...
}

// Update Tenant model - add this relation
model Tenant {
  // ... existing fields ...
  
  // NEW RELATION - Add this
  registrationRequests    RegistrationRequest[]
  
  // ... rest of existing fields ...
}

// Update Organization model - add this relation
model Organization {
  // ... existing fields ...
  
  // NEW RELATION - Add this
  registrationRequests    RegistrationRequest[]
  
  // ... rest of existing fields ...
}
```

**1.2 Run Migration**

```bash
cd server
npx prisma migrate dev --name add_registration_requests
```

**1.3 Verify Migration**

```bash
npx prisma studio
# Check that registration_requests table exists
```

---

### Step 2: Create Registration Service (1-2 hours)

**2.1 Create `server/src/services/registration.service.ts`**

```typescript
import { PrismaClient, RegistrationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Logger } from '../utils/Logger';
import { EmailVerificationService } from './emailVerification.service';
import { EmailService } from './email.service';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export class RegistrationService {
  private emailVerificationService = new EmailVerificationService();
  private emailService = new EmailService();

  /**
   * PHASE 1: Create registration request (public)
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
  }) {
    const { email, password, fullName, companyName, contact } = data;
    const { ipAddress, userAgent } = metadata;

    Logger.info('Creating registration request', { email });

    // Check if email already exists in registration requests or users
    const existingRequest = await prisma.registrationRequest.findUnique({
      where: { email },
    });

    if (existingRequest) {
      throw new Error('A registration request with this email already exists');
    }

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create registration request
    const request = await prisma.registrationRequest.create({
      data: {
        email,
        fullName,
        companyName,
        contact,
        passwordHash,
        status: RegistrationStatus.PENDING,
        ipAddress,
        userAgent,
      },
    });

    // Send verification email
    try {
      await this.emailVerificationService.sendVerificationEmail(
        request.id,
        BASE_URL,
        email
      );
      Logger.info('Verification email sent', { requestId: request.id, email });
    } catch (error: any) {
      Logger.error('Failed to send verification email', {
        error: error.message,
        requestId: request.id,
      });
      // Don't fail registration if email fails
    }

    return {
      requestId: request.id,
      email: request.email,
      status: request.status,
      message: 'Registration request created. Please check your email to verify your account.',
    };
  }

  /**
   * Verify email from registration request
   */
  async verifyRegistrationEmail(token: string) {
    // Implement email verification logic
    // Update status to EMAIL_VERIFIED
    Logger.info('Email verified for registration request');
  }

  /**
   * PHASE 2: Admin assigns tenant to request
   */
  async assignTenantToRequest(
    requestId: string,
    adminUserId: string,
    assignment: {
      tenantId: string;
      organizationId?: string;
    }
  ) {
    Logger.info('Assigning tenant to registration request', {
      requestId,
      tenantId: assignment.tenantId,
    });

    // Get registration request
    const request = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Registration request not found');
    }

    if (request.status !== RegistrationStatus.EMAIL_VERIFIED) {
      throw new Error('Email must be verified before tenant assignment');
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: assignment.tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Create user record
    const user = await prisma.user.create({
      data: {
        email: request.email,
        loginId: request.email,
        userName: request.fullName,
        passwordHash: request.passwordHash,
        companyName: request.companyName,
        contact: request.contact,
        tenantId: assignment.tenantId,
        organizationId: assignment.organizationId,
        isApproved: false, // Not approved yet
        registrationRequestId: request.id,
      },
    });

    // Update registration request
    await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: RegistrationStatus.TENANT_ASSIGNED,
        assignedTenantId: assignment.tenantId,
        assignedOrgId: assignment.organizationId,
        assignedByAdminId: adminUserId,
        assignedAt: new Date(),
      },
    });

    Logger.info('User created and tenant assigned', {
      userId: user.id,
      tenantId: assignment.tenantId,
    });

    // TODO: Send notification to tenant admin

    return {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      tenantName: tenant.name,
      status: RegistrationStatus.TENANT_ASSIGNED,
    };
  }

  /**
   * PHASE 3: Tenant admin approves user and assigns roles
   */
  async approveUserAndAssignRoles(
    userId: string,
    tenantAdminId: string,
    assignment: {
      roleIds: string[];
      organizationId?: string;
    }
  ) {
    Logger.info('Approving user and assigning roles', {
      userId,
      roleIds: assignment.roleIds,
    });

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { registrationRequest: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isApproved) {
      throw new Error('User is already approved');
    }

    // Verify roles belong to the same tenant
    const roles = await prisma.role.findMany({
      where: {
        id: { in: assignment.roleIds },
        tenantId: user.tenantId,
      },
    });

    if (roles.length !== assignment.roleIds.length) {
      throw new Error('One or more roles are invalid or do not belong to this tenant');
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        approvedBy: tenantAdminId,
        approvedAt: new Date(),
        organizationId: assignment.organizationId || user.organizationId,
      },
    });

    // Assign roles
    await prisma.userRole.createMany({
      data: assignment.roleIds.map(roleId => ({
        userId,
        roleId,
      })),
    });

    // Update registration request
    if (user.registrationRequestId) {
      await prisma.registrationRequest.update({
        where: { id: user.registrationRequestId },
        data: {
          status: RegistrationStatus.COMPLETED,
          approvedByTenantAdminId: tenantAdminId,
          approvedAt: new Date(),
        },
      });
    }

    Logger.info('User approved successfully', { userId });

    // TODO: Send welcome email

    return {
      userId: user.id,
      email: user.email,
      isApproved: true,
      roles: roles.map(r => ({ id: r.id, name: r.name })),
    };
  }

  /**
   * Get pending registration requests (Admin)
   */
  async getPendingRequests(filters?: {
    status?: RegistrationStatus;
    emailVerified?: boolean;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    const requests = await prisma.registrationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: true,
        organization: true,
      },
    });

    return requests;
  }

  /**
   * Get pending users for tenant (Tenant Admin)
   */
  async getPendingUsersForTenant(tenantId: string) {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        isApproved: false,
      },
      include: {
        organization: true,
        registrationRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Reject registration request
   */
  async rejectRegistrationRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
  ) {
    await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: RegistrationStatus.REJECTED,
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    Logger.info('Registration request rejected', { requestId, reason });

    // TODO: Send rejection email
  }
}
```

---

### Step 3: Create Registration Controller (30 minutes)

**3.1 Create `server/src/controllers/registration.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { RegistrationService } from '../services/registration.service';
import { ApiResponse } from '../utils/ApiResponse';

const registrationService = new RegistrationService();

export class RegistrationController {
  /**
   * POST /api/registration/request
   * Public endpoint for user self-registration
   */
  async createRequest(req: Request, res: Response) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await registrationService.createRegistrationRequest(
        req.body,
        { ipAddress, userAgent }
      );

      res.status(201).json(ApiResponse.success(result, result.message));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  /**
   * GET /api/registration/requests
   * Get pending registration requests (Admin only)
   */
  async getPendingRequests(req: Request, res: Response) {
    try {
      const { status, emailVerified } = req.query;

      const requests = await registrationService.getPendingRequests({
        status: status as any,
        emailVerified: emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined,
      });

      res.status(200).json(ApiResponse.success({ requests }));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }

  /**
   * POST /api/registration/requests/:id/assign-tenant
   * Assign tenant to registration request (Admin only)
   */
  async assignTenant(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminUserId = (req as any).user?.userId;

      const result = await registrationService.assignTenantToRequest(
        id,
        adminUserId,
        req.body
      );

      res.status(200).json(
        ApiResponse.success(result, 'Tenant assigned successfully')
      );
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  /**
   * GET /api/registration/pending-users
   * Get users pending role assignment (Tenant Admin only)
   */
  async getPendingUsers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      const users = await registrationService.getPendingUsersForTenant(tenantId);

      res.status(200).json(ApiResponse.success({ users }));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }

  /**
   * POST /api/registration/users/:id/approve
   * Approve user and assign roles (Tenant Admin only)
   */
  async approveUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantAdminId = (req as any).user?.userId;

      const result = await registrationService.approveUserAndAssignRoles(
        id,
        tenantAdminId,
        req.body
      );

      res.status(200).json(
        ApiResponse.success(result, 'User approved successfully')
      );
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  /**
   * POST /api/registration/requests/:id/reject
   * Reject registration request (Admin only)
   */
  async rejectRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const adminUserId = (req as any).user?.userId;
      const { reason } = req.body;

      await registrationService.rejectRegistrationRequest(id, adminUserId, reason);

      res.status(200).json(
        ApiResponse.success({}, 'Registration request rejected')
      );
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }
}
```

---

### Step 4: Create Routes (15 minutes)

**4.1 Create `server/src/routes/registration.routes.ts`**

```typescript
import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authenticate } from '../middlewares/authenticate';
import { requirePermission } from '../middlewares/requirePermission';
import rateLimit from 'express-rate-limit';

const router = Router();
const registrationController = new RegistrationController();

// Rate limiter for registration endpoint
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per IP
  message: 'Too many registration attempts. Please try again later.',
});

// Public routes
router.post(
  '/request',
  registrationLimiter,
  registrationController.createRequest.bind(registrationController)
);

// Admin routes (System Admin only)
router.get(
  '/requests',
  authenticate,
  requirePermission('registration:view_requests'),
  registrationController.getPendingRequests.bind(registrationController)
);

router.post(
  '/requests/:id/assign-tenant',
  authenticate,
  requirePermission('registration:assign_tenant'),
  registrationController.assignTenant.bind(registrationController)
);

router.post(
  '/requests/:id/reject',
  authenticate,
  requirePermission('registration:reject_request'),
  registrationController.rejectRequest.bind(registrationController)
);

// Tenant Admin routes
router.get(
  '/pending-users',
  authenticate,
  requirePermission('user:view_pending'),
  registrationController.getPendingUsers.bind(registrationController)
);

router.post(
  '/users/:id/approve',
  authenticate,
  requirePermission('user:approve'),
  registrationController.approveUser.bind(registrationController)
);

export default router;
```

**4.2 Register routes in `server/src/index.ts`**

```typescript
import registrationRoutes from './routes/registration.routes';

// Add this line with other route registrations
app.use('/api/registration', registrationRoutes);
```

---

### Step 5: Update Permissions (15 minutes)

**5.1 Update `server/src/config/permissions.ts`**

Add these permissions:

```typescript
export const REGISTRATION_PERMISSIONS = {
  // System Admin
  'registration:view_requests': 'View all registration requests',
  'registration:assign_tenant': 'Assign users to tenants',
  'registration:reject_request': 'Reject registration requests',
  
  // Tenant Admin
  'user:view_pending': 'View pending users in tenant',
  'user:approve': 'Approve users in tenant',
  'user:assign_roles': 'Assign roles to users',
};
```

**5.2 Update seed data to include these permissions for System Admin and Tenant Admin roles**

---

### Step 6: Test the Implementation (30 minutes)

**6.1 Test Registration Request Creation**

```bash
curl -X POST http://localhost:3000/api/registration/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecureP@ss123",
    "fullName": "Test User",
    "companyName": "Test Corp"
  }'
```

**6.2 Test Admin Endpoints**

```bash
# Get pending requests
curl -X GET http://localhost:3000/api/registration/requests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Assign tenant
curl -X POST http://localhost:3000/api/registration/requests/REQUEST_ID/assign-tenant \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID"
  }'
```

**6.3 Test Tenant Admin Endpoints**

```bash
# Get pending users
curl -X GET http://localhost:3000/api/registration/pending-users \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN"

# Approve user
curl -X POST http://localhost:3000/api/registration/users/USER_ID/approve \
  -H "Authorization: Bearer YOUR_TENANT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": ["ROLE_ID_1", "ROLE_ID_2"]
  }'
```

---

## 🎨 Frontend Implementation (Optional - Phase 2)

### Create Registration Page

**`client/src/pages/Register.tsx`**

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    contact: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('/api/registration/request', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        companyName: formData.companyName,
        contact: formData.contact,
      });

      setSuccess(true);
      // Show success message or redirect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="success-message">
        <h2>Registration Successful!</h2>
        <p>Please check your email to verify your account.</p>
      </div>
    );
  }

  return (
    <div className="register-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
        <input
          type="text"
          name="companyName"
          placeholder="Company Name (Optional)"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        />
        <input
          type="tel"
          name="contact"
          placeholder="Contact Number (Optional)"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Register</button>
      </form>
    </div>
  );
};
```

---

## 📊 Monitoring & Verification

### Check Database

```sql
-- Check registration requests
SELECT * FROM registration_requests ORDER BY created_at DESC;

-- Check users pending approval
SELECT * FROM users WHERE is_approved = false;

-- Check completed registrations
SELECT 
  rr.email,
  rr.status,
  u.is_approved,
  u.tenant_id,
  t.name as tenant_name
FROM registration_requests rr
LEFT JOIN users u ON u.registration_request_id = rr.id
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE rr.status = 'COMPLETED';
```

### Monitor Logs

```bash
# Watch server logs
cd server
npm run dev

# Look for these log messages:
# - "Creating registration request"
# - "Verification email sent"
# - "Assigning tenant to registration request"
# - "User created and tenant assigned"
# - "Approving user and assigning roles"
# - "User approved successfully"
```

---

## 🐛 Troubleshooting

### Issue: "Email already exists"
**Solution:** Check both `registration_requests` and `users` tables for existing email.

### Issue: "Email must be verified"
**Solution:** Implement email verification logic or manually update `emailVerified` to `true` for testing.

### Issue: "Roles are invalid"
**Solution:** Ensure role IDs belong to the same tenant as the user.

### Issue: Rate limit errors
**Solution:** Adjust rate limiter settings or wait 15 minutes between attempts.

---

## ✅ Success Criteria

You've successfully implemented the registration workflow when:

- [ ] Users can create registration requests via API
- [ ] Admins can view pending requests
- [ ] Admins can assign tenants to requests
- [ ] Tenant admins can view pending users in their tenant
- [ ] Tenant admins can approve users and assign roles
- [ ] Approved users can login successfully
- [ ] All database relationships are correct
- [ ] Logs show all workflow steps

---

## 🚀 Next Steps

1. **Implement Email Verification** - Add token-based email verification
2. **Add Frontend UI** - Create admin dashboards and registration page
3. **Add Notifications** - Email notifications for all workflow steps
4. **Add Tests** - Unit, integration, and E2E tests
5. **Add Audit Logging** - Track all registration workflow actions
6. **Production Deployment** - Deploy with proper monitoring

---

**Need Help?** Refer to the [Full Architecture Review](./REGISTRATION_ARCHITECTURE_REVIEW.md) for detailed explanations.
