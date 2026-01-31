# Registration Workflow - Developer Quick Reference

## 🎯 Overview

**Three-Tier Approval Process:**
1. User Self-Registration → Creates `RegistrationRequest`
2. Admin Tenant Assignment → Creates `User` (unapproved)
3. Tenant Admin Role Assignment → Approves `User`

---

## 📊 State Flow

```
PENDING → EMAIL_VERIFIED → TENANT_ASSIGNED → COMPLETED
   ↓            ↓                ↓
REJECTED    REJECTED        REJECTED
```

---

## 🗄️ Database Models

### RegistrationRequest
```typescript
{
  id: string
  email: string (unique)
  fullName: string
  status: RegistrationStatus
  emailVerified: boolean
  assignedTenantId?: string
  assignedByAdminId?: string
  approvedByTenantAdminId?: string
}
```

### User (Updated)
```typescript
{
  // ... existing fields
  isApproved: boolean (default: false)
  approvedBy?: string
  approvedAt?: DateTime
  registrationRequestId?: string
}
```

---

## 🔌 API Endpoints

### Public
```bash
POST   /api/registration/request           # Create registration
POST   /api/registration/verify-email      # Verify email
GET    /api/registration/status/:id        # Check status
```

### System Admin
```bash
GET    /api/registration/requests          # List requests
POST   /api/registration/requests/:id/assign-tenant
POST   /api/registration/requests/:id/reject
```

### Tenant Admin
```bash
GET    /api/registration/pending-users     # List pending users
POST   /api/registration/users/:id/approve # Approve & assign roles
```

---

## 🔐 Permissions

### System Admin
- `registration:view_requests`
- `registration:assign_tenant`
- `registration:reject_request`

### Tenant Admin
- `user:view_pending`
- `user:approve`
- `user:assign_roles`

---

## 💻 Code Examples

### Create Registration Request
```typescript
const result = await registrationService.createRegistrationRequest({
  email: 'user@example.com',
  password: 'SecureP@ss123',
  fullName: 'John Doe',
  companyName: 'Acme Corp',
}, {
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Assign Tenant (Admin)
```typescript
const result = await registrationService.assignTenantToRequest(
  requestId,
  adminUserId,
  {
    tenantId: 'tenant-uuid',
    organizationId: 'org-uuid', // optional
  }
);
```

### Approve User (Tenant Admin)
```typescript
const result = await registrationService.approveUserAndAssignRoles(
  userId,
  tenantAdminId,
  {
    roleIds: ['role-1', 'role-2'],
    organizationId: 'org-uuid', // optional
  }
);
```

---

## 🧪 Testing

### Unit Test Example
```typescript
describe('RegistrationService', () => {
  it('should create registration request', async () => {
    const result = await registrationService.createRegistrationRequest({
      email: 'test@example.com',
      password: 'SecureP@ss123',
      fullName: 'Test User',
    }, {});
    
    expect(result.status).toBe('PENDING');
  });
});
```

### Integration Test Example
```typescript
it('should complete full workflow', async () => {
  // 1. Create request
  const request = await createRequest();
  
  // 2. Verify email
  await verifyEmail(request.id);
  
  // 3. Admin assigns tenant
  const user = await assignTenant(request.id, tenantId);
  
  // 4. Tenant admin approves
  await approveUser(user.id, [roleId]);
  
  // 5. User can login
  const loginResult = await login(email, password);
  expect(loginResult.token).toBeDefined();
});
```

---

## 🐛 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Email already exists" | Duplicate email | Check both tables |
| "Email must be verified" | Status not EMAIL_VERIFIED | Verify email first |
| "Roles are invalid" | Wrong tenant | Use tenant's roles |
| "User already approved" | Duplicate approval | Check user status |

---

## 📝 Migration Checklist

- [ ] Update `schema.prisma`
- [ ] Run `npx prisma migrate dev`
- [ ] Create `RegistrationService`
- [ ] Create `RegistrationController`
- [ ] Create routes
- [ ] Update permissions
- [ ] Add to seed data
- [ ] Test all endpoints
- [ ] Update documentation

---

## 🔍 Debugging

### Check Registration Status
```sql
SELECT * FROM registration_requests 
WHERE email = 'user@example.com';
```

### Check User Approval
```sql
SELECT u.email, u.is_approved, rr.status
FROM users u
LEFT JOIN registration_requests rr ON rr.id = u.registration_request_id
WHERE u.email = 'user@example.com';
```

### Check Assigned Roles
```sql
SELECT u.email, r.name as role_name
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.email = 'user@example.com';
```

---

## 📚 Documentation Links

- [Full Architecture Review](./REGISTRATION_ARCHITECTURE_REVIEW.md)
- [Implementation Checklist](./REGISTRATION_IMPLEMENTATION_CHECKLIST.md)
- [Quick Start Guide](./REGISTRATION_QUICK_START.md)
- [Review Summary](./REGISTRATION_REVIEW_SUMMARY.md)

---

**Last Updated:** 2026-01-21
