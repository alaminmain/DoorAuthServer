# Registration Implementation Checklist

## Overview
This checklist tracks the implementation of the new three-tier registration workflow for DoorAuth.

**Reference Document:** [REGISTRATION_ARCHITECTURE_REVIEW.md](./REGISTRATION_ARCHITECTURE_REVIEW.md)

---

## Phase 1: Database Schema Updates ⏳

### 1.1 Prisma Schema Changes
- [ ] Create `RegistrationStatus` enum
  ```prisma
  enum RegistrationStatus {
    PENDING
    EMAIL_VERIFIED
    TENANT_ASSIGNED
    COMPLETED
    REJECTED
    EXPIRED
  }
  ```

- [ ] Create `RegistrationRequest` model
  - [ ] Basic fields (email, fullName, passwordHash, etc.)
  - [ ] Status tracking fields
  - [ ] Admin assignment fields
  - [ ] Tenant admin approval fields
  - [ ] Rejection fields
  - [ ] Metadata fields (IP, user agent, timestamps)
  - [ ] Relations to Tenant, Organization, User

- [ ] Update `User` model
  - [ ] Make `tenantId` optional (`String?`)
  - [ ] Change `isApproved` default to `false`
  - [ ] Add `approvedBy` field
  - [ ] Add `approvedAt` field
  - [ ] Add `registrationRequestId` field (unique)
  - [ ] Add relation to `RegistrationRequest`

### 1.2 Database Migration
- [ ] Generate Prisma migration: `npx prisma migrate dev --name add_registration_requests`
- [ ] Review generated SQL
- [ ] Test migration on development database
- [ ] Create rollback script
- [ ] Update seed data to include:
  - [ ] Sample registration requests
  - [ ] Registration-related permissions

### 1.3 Indexes & Performance
- [ ] Add index on `registration_requests.status`
- [ ] Add index on `registration_requests.email_verified`
- [ ] Add index on `registration_requests.assigned_tenant_id`
- [ ] Add index on `registration_requests.created_at`
- [ ] Add index on `users.registration_request_id`

**Estimated Time:** 2-3 days  
**Dependencies:** None  
**Assignee:** _____________

---

## Phase 2: Backend Services ⏳

### 2.1 Create RegistrationService
- [ ] Create file: `server/src/services/registration.service.ts`
- [ ] Implement `createRegistrationRequest()`
  - [ ] Validate email uniqueness
  - [ ] Hash password
  - [ ] Create registration request
  - [ ] Send verification email
  - [ ] Return request ID and status
- [ ] Implement `verifyRegistrationEmail()`
  - [ ] Validate token
  - [ ] Update status to EMAIL_VERIFIED
  - [ ] Log audit event
- [ ] Implement `assignTenantToRequest()`
  - [ ] Verify admin permissions
  - [ ] Validate tenant exists
  - [ ] Create User record
  - [ ] Update request status to TENANT_ASSIGNED
  - [ ] Notify tenant admin
  - [ ] Log audit event
- [ ] Implement `approveUserAndAssignRoles()`
  - [ ] Verify tenant admin permissions
  - [ ] Validate roles belong to tenant
  - [ ] Assign roles to user
  - [ ] Update user.isApproved to true
  - [ ] Update request status to COMPLETED
  - [ ] Send welcome email
  - [ ] Log audit event
- [ ] Implement `rejectRegistrationRequest()`
  - [ ] Update status to REJECTED
  - [ ] Store rejection reason
  - [ ] Send rejection email
  - [ ] Log audit event
- [ ] Implement `getPendingRequests()`
  - [ ] Filter by status, email verification
  - [ ] Paginate results
  - [ ] Return formatted data
- [ ] Implement `getPendingUsersForTenant()`
  - [ ] Filter by tenant
  - [ ] Filter by isApproved = false
  - [ ] Return formatted data

### 2.2 Update AuthService
- [ ] Update `register()` method
  - [ ] Add deprecation warning
  - [ ] Redirect to RegistrationService
  - [ ] Maintain backward compatibility (optional)
- [ ] Update `login()` method
  - [ ] Enhanced approval status checks
  - [ ] Better error messages for pending users
  - [ ] Check registration request status

### 2.3 Email Templates
- [ ] Create `registration-verification.html`
- [ ] Create `registration-approved.html`
- [ ] Create `registration-rejected.html`
- [ ] Create `tenant-admin-notification.html`
- [ ] Update EmailService to support new templates

### 2.4 Audit Logging
- [ ] Add audit events:
  - [ ] `REGISTRATION_REQUEST_CREATED`
  - [ ] `REGISTRATION_EMAIL_VERIFIED`
  - [ ] `TENANT_ASSIGNED_TO_REQUEST`
  - [ ] `USER_APPROVED_BY_TENANT_ADMIN`
  - [ ] `REGISTRATION_REQUEST_REJECTED`

**Estimated Time:** 4-5 days  
**Dependencies:** Phase 1 complete  
**Assignee:** _____________

---

## Phase 3: Controllers & Routes ⏳

### 3.1 Create RegistrationController
- [ ] Create file: `server/src/controllers/registration.controller.ts`
- [ ] Implement `createRequest()` - POST /api/registration/request
- [ ] Implement `verifyEmail()` - POST /api/registration/verify-email
- [ ] Implement `getStatus()` - GET /api/registration/status/:requestId
- [ ] Implement `getPendingRequests()` - GET /api/registration/requests
- [ ] Implement `assignTenant()` - POST /api/registration/requests/:id/assign-tenant
- [ ] Implement `rejectRequest()` - POST /api/registration/requests/:id/reject
- [ ] Implement `getPendingUsers()` - GET /api/registration/pending-users
- [ ] Implement `approveUser()` - POST /api/registration/users/:id/approve

### 3.2 Create Routes
- [ ] Create file: `server/src/routes/registration.routes.ts`
- [ ] Configure public routes (no auth):
  - [ ] POST /api/registration/request
  - [ ] POST /api/registration/verify-email
  - [ ] GET /api/registration/status/:requestId
- [ ] Configure admin routes (system admin):
  - [ ] GET /api/registration/requests
  - [ ] POST /api/registration/requests/:id/assign-tenant
  - [ ] POST /api/registration/requests/:id/reject
- [ ] Configure tenant admin routes:
  - [ ] GET /api/registration/pending-users
  - [ ] POST /api/registration/users/:id/approve
- [ ] Add rate limiting to public endpoints
- [ ] Register routes in main app

### 3.3 Middleware & Permissions
- [ ] Create `requireRegistrationPermission()` middleware
- [ ] Add permission definitions to `permissions.ts`:
  - [ ] `registration:view_requests`
  - [ ] `registration:assign_tenant`
  - [ ] `registration:reject_request`
  - [ ] `user:view_pending`
  - [ ] `user:approve`
  - [ ] `user:assign_roles`
- [ ] Update System Admin role with registration permissions
- [ ] Update Tenant Admin role with user approval permissions

### 3.4 Validation Schemas
- [ ] Create Zod schemas for:
  - [ ] Registration request creation
  - [ ] Email verification
  - [ ] Tenant assignment
  - [ ] User approval with roles
  - [ ] Request rejection

### 3.5 API Documentation
- [ ] Update Swagger/OpenAPI specs
- [ ] Add request/response examples
- [ ] Document error codes
- [ ] Update Postman collection

**Estimated Time:** 2-3 days  
**Dependencies:** Phase 2 complete  
**Assignee:** _____________

---

## Phase 4: Frontend - Admin Panels ⏳

### 4.1 System Admin - Registration Requests Dashboard
- [ ] Create page: `client/src/pages/admin/RegistrationRequests.tsx`
- [ ] Implement request list table
  - [ ] Columns: Email, Name, Company, Status, Email Verified, Created At, Actions
  - [ ] Filters: Status, Email Verified
  - [ ] Pagination
  - [ ] Search by email/name
- [ ] Implement "Assign Tenant" modal
  - [ ] Tenant selection dropdown
  - [ ] Organization selection (optional)
  - [ ] Confirmation dialog
- [ ] Implement "Reject Request" modal
  - [ ] Reason text area
  - [ ] Confirmation dialog
- [ ] Add real-time updates (optional)
- [ ] Add export to CSV functionality

### 4.2 Tenant Admin - Pending Users Dashboard
- [ ] Create page: `client/src/pages/tenant-admin/PendingUsers.tsx`
- [ ] Implement pending users table
  - [ ] Columns: Email, Name, Organization, Assigned By, Assigned At, Actions
  - [ ] Filters: Organization
  - [ ] Search by email/name
- [ ] Implement "Approve & Assign Roles" modal
  - [ ] Role selection (multi-select)
  - [ ] Organization selection (if not assigned)
  - [ ] Confirmation dialog
- [ ] Implement "Reject User" modal
  - [ ] Reason text area
  - [ ] Confirmation dialog
- [ ] Add notification badge for pending count

### 4.3 Services & API Integration
- [ ] Create `client/src/services/registration.service.ts`
  - [ ] `getPendingRequests()`
  - [ ] `assignTenantToRequest()`
  - [ ] `rejectRequest()`
  - [ ] `getPendingUsers()`
  - [ ] `approveUser()`
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add success/error notifications

### 4.4 Navigation & Permissions
- [ ] Add "Registration Requests" menu item (System Admin only)
- [ ] Add "Pending Users" menu item (Tenant Admin only)
- [ ] Update permission checks in navigation
- [ ] Add notification badges for pending counts

**Estimated Time:** 5-6 days  
**Dependencies:** Phase 3 complete  
**Assignee:** _____________

---

## Phase 5: Frontend - User Registration ⏳

### 5.1 Public Registration Page
- [ ] Create page: `client/src/pages/public/Register.tsx`
- [ ] Implement registration form
  - [ ] Email field (with validation)
  - [ ] Password field (with strength indicator)
  - [ ] Confirm password field
  - [ ] Full name field
  - [ ] Company name field (optional)
  - [ ] Contact field (optional)
  - [ ] Terms & conditions checkbox
- [ ] Add form validation (Zod + React Hook Form)
- [ ] Add password strength indicator
- [ ] Add CAPTCHA (optional)
- [ ] Show success message with next steps
- [ ] Add "Already have an account?" link

### 5.2 Email Verification Flow
- [ ] Create page: `client/src/pages/public/VerifyEmail.tsx`
- [ ] Handle verification token from URL
- [ ] Show verification status
- [ ] Redirect to status page on success
- [ ] Handle expired/invalid tokens

### 5.3 Registration Status Page
- [ ] Create page: `client/src/pages/public/RegistrationStatus.tsx`
- [ ] Show current registration status
- [ ] Display appropriate messages:
  - [ ] "Pending email verification"
  - [ ] "Pending admin approval"
  - [ ] "Pending role assignment"
  - [ ] "Approved - you can now login"
  - [ ] "Rejected" with reason
- [ ] Add "Resend verification email" button
- [ ] Add "Contact support" link

### 5.4 Update Login Page
- [ ] Update error messages for unapproved users
  - [ ] "Registration pending admin approval"
  - [ ] "Account pending role assignment"
- [ ] Add link to registration status page
- [ ] Add "Don't have an account? Register" link

### 5.5 Styling & UX
- [ ] Design registration form (modern, clean)
- [ ] Add loading spinners
- [ ] Add success/error animations
- [ ] Ensure mobile responsiveness
- [ ] Add accessibility features (ARIA labels, keyboard navigation)

**Estimated Time:** 3-4 days  
**Dependencies:** Phase 3 complete  
**Assignee:** _____________

---

## Phase 6: Testing ⏳

### 6.1 Unit Tests
- [ ] RegistrationService tests
  - [ ] `createRegistrationRequest()` - success cases
  - [ ] `createRegistrationRequest()` - duplicate email
  - [ ] `createRegistrationRequest()` - password hashing
  - [ ] `verifyRegistrationEmail()` - valid token
  - [ ] `verifyRegistrationEmail()` - invalid/expired token
  - [ ] `assignTenantToRequest()` - success
  - [ ] `assignTenantToRequest()` - unverified email
  - [ ] `approveUserAndAssignRoles()` - success
  - [ ] `approveUserAndAssignRoles()` - invalid roles
  - [ ] `rejectRegistrationRequest()` - success
- [ ] AuthService tests
  - [ ] Updated `login()` with approval checks
  - [ ] Error messages for pending users
- [ ] Controller tests
  - [ ] All endpoints with valid data
  - [ ] All endpoints with invalid data
  - [ ] Permission checks

### 6.2 Integration Tests
- [ ] Complete registration workflow
  - [ ] User registration → Email verification → Tenant assignment → Role assignment → Login
- [ ] Rejection workflows
  - [ ] Admin rejects request
  - [ ] Tenant admin rejects user
- [ ] Edge cases
  - [ ] Expired registration requests
  - [ ] Duplicate email handling
  - [ ] Invalid tenant assignment
  - [ ] Invalid role assignment

### 6.3 E2E Tests
- [ ] User registration flow (Playwright/Cypress)
  - [ ] Fill registration form
  - [ ] Verify email
  - [ ] Check status page
- [ ] Admin approval flow
  - [ ] Login as admin
  - [ ] View pending requests
  - [ ] Assign tenant
- [ ] Tenant admin approval flow
  - [ ] Login as tenant admin
  - [ ] View pending users
  - [ ] Assign roles and approve
- [ ] Complete user journey
  - [ ] Register → Approve → Login → Access dashboard

### 6.4 Security Testing
- [ ] Rate limiting on registration endpoint
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Permission bypass attempts
- [ ] Email enumeration prevention

### 6.5 Performance Testing
- [ ] Load test registration endpoint
- [ ] Load test admin dashboards with many pending requests
- [ ] Database query optimization
- [ ] Index effectiveness

**Estimated Time:** 4-5 days  
**Dependencies:** Phases 2-5 complete  
**Assignee:** _____________

---

## Phase 7: Documentation & Deployment ⏳

### 7.1 API Documentation
- [ ] Update API documentation
- [ ] Add code examples for all endpoints
- [ ] Document error codes and messages
- [ ] Create Postman collection
- [ ] Update integration guide

### 7.2 User Guides
- [ ] Create "User Registration Guide"
  - [ ] How to register
  - [ ] Email verification process
  - [ ] What to expect after registration
- [ ] Create "Admin Guide - Managing Registration Requests"
  - [ ] Viewing pending requests
  - [ ] Assigning tenants
  - [ ] Rejecting requests
- [ ] Create "Tenant Admin Guide - Approving Users"
  - [ ] Viewing pending users
  - [ ] Assigning roles
  - [ ] Approving users

### 7.3 Developer Documentation
- [ ] Update architecture documentation
- [ ] Document new database models
- [ ] Document service layer changes
- [ ] Add code comments
- [ ] Create migration guide for existing deployments

### 7.4 Deployment Preparation
- [ ] Create deployment checklist
- [ ] Prepare rollback plan
- [ ] Create data migration scripts
- [ ] Update environment variables documentation
- [ ] Configure monitoring and alerts
- [ ] Set up error tracking (Sentry, etc.)

### 7.5 Production Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Migrate existing users (if needed)
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Verify all workflows working

**Estimated Time:** 2-3 days  
**Dependencies:** Phase 6 complete  
**Assignee:** _____________

---

## Post-Deployment ⏳

### Monitoring & Maintenance
- [ ] Set up dashboards for registration metrics
- [ ] Monitor pending request queue
- [ ] Set up alerts for high pending counts
- [ ] Review and optimize performance
- [ ] Gather user feedback
- [ ] Plan for future enhancements

### Future Enhancements (Optional)
- [ ] Bulk user import/approval
- [ ] Custom registration fields per tenant
- [ ] Integration with external identity providers
- [ ] Self-service tenant creation (with approval)
- [ ] Automated role assignment based on rules
- [ ] Registration analytics dashboard

---

## Summary

**Total Estimated Timeline:** 4-5 weeks

**Critical Path:**
1. Database schema (Phase 1)
2. Backend services (Phase 2)
3. API routes (Phase 3)
4. Frontend implementation (Phases 4-5)
5. Testing (Phase 6)
6. Deployment (Phase 7)

**Key Success Metrics:**
- ✅ Zero unauthorized tenant access
- ✅ 100% of new users go through approval workflow
- ✅ < 5 seconds average registration request creation time
- ✅ 90%+ test coverage
- ✅ Zero production incidents during deployment

---

**Last Updated:** 2026-01-21  
**Document Owner:** Senior Software Architect
