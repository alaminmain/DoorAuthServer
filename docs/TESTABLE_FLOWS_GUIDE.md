# Complete Testable Flows Guide

**Generated:** 2026-01-30
**Purpose:** Document all fully implemented features that can be tested end-to-end

---

## Quick Reference: Flow Status

| Flow | Status | Server | Client UI | Notes |
|------|--------|--------|-----------|-------|
| Authentication | ✅ Complete | ✅ | ✅ | Login, logout, token refresh |
| Tenant CRUD | ✅ Complete | ✅ | ✅ | Full management |
| Application CRUD | ✅ Complete | ✅ | ✅ | OAuth clients |
| User CRUD | ✅ Complete | ✅ | ✅ | Full management |
| Role CRUD | ✅ Complete | ✅ | ✅ | With permissions |
| User-Role Assignment | ✅ Complete | ✅ | ✅ | Assign/remove |
| Menu CRUD | ✅ Complete | ✅ | ✅ | Hierarchical |
| Organization CRUD | ✅ Complete | ✅ | ✅ | Hierarchical |
| Session Management | ✅ Complete | ✅ | ✅ | View/revoke |
| Password Reset (Admin) | ✅ Complete | ✅ | ✅ | Admin resets for user |
| 2FA Setup | ⚠️ Partial | ✅ | ❌ | Server only |
| Password Recovery (Self) | ⚠️ Partial | ✅ | ❌ | Server only |
| Email Verification | ⚠️ Partial | ✅ | ❌ | Server only |

---

## FLOW 1: Authentication

### Prerequisites
- Server running at https://localhost:3000
- Client running at http://localhost:5173
- Database seeded with default user

### Test Steps

#### 1.1 Login Flow
```
1. Navigate to http://localhost:5173/login
2. Enter credentials:
   - Email: bd@gmail.com
   - Password: 1q2w3E*
3. Click "Sign In"
4. Verify redirect to dashboard
5. Verify sidebar navigation appears
```

**Expected Results:**
- JWT token stored in localStorage
- User redirected to dashboard
- Dashboard statistics load

#### 1.2 Token Refresh Flow
```
1. Login successfully
2. Wait for token to near expiry (or manually expire)
3. Perform any API action
4. Verify automatic token refresh
```

**Expected Results:**
- New token obtained without user intervention
- API call succeeds after refresh

#### 1.3 Logout Flow
```
1. Login successfully
2. Click user menu in header
3. Click "Logout"
4. Verify redirect to login page
```

**Expected Results:**
- Tokens cleared from localStorage
- Session revoked on server
- Redirect to login page

---

## FLOW 2: Tenant Management

### Prerequisites
- Logged in as super admin (user without tenantId)

### Test Steps

#### 2.1 Create Tenant
```
1. Navigate to /tenants
2. Click "Create Tenant" button
3. Fill form:
   - Name: "Test Company"
   - Domain: "test-company"
4. Click "Create"
```

**Expected Results:**
- Tenant appears in list
- Success toast notification

#### 2.2 Edit Tenant
```
1. In tenant list, click edit icon on a tenant
2. Modify name to "Test Company Updated"
3. Click "Save"
```

**Expected Results:**
- Tenant name updated in list
- Success toast notification

#### 2.3 Delete Tenant
```
1. In tenant list, click delete icon on a tenant
2. Confirm deletion in dialog
```

**Expected Results:**
- Tenant removed from list
- Success toast notification

**API Endpoints Used:**
- `GET /api/tenants`
- `POST /api/tenants`
- `PUT /api/tenants/{id}`
- `DELETE /api/tenants/{id}`

---

## FLOW 3: Application (OAuth Client) Management

### Prerequisites
- Logged in user
- At least one tenant exists

### Test Steps

#### 3.1 Create Application
```
1. Navigate to /applications
2. Click "Create Application" button
3. Fill form:
   - Tenant: Select from dropdown
   - Name: "My Web App"
   - Description: "Test application"
   - App URL: "https://myapp.local"
   - Redirect URIs: Add "https://myapp.local/callback"
4. Click "Create"
```

**Expected Results:**
- Modal shows Client ID and Client Secret
- **Important:** Copy credentials (secret shown only once)
- Application appears in list

#### 3.2 Regenerate Client Secret
```
1. In application list, click on an application
2. Click "Regenerate Secret" button
3. Confirm in dialog
```

**Expected Results:**
- New secret displayed
- Old secret invalidated

#### 3.3 Edit Application
```
1. Click edit icon on an application
2. Add another redirect URI
3. Click "Save"
```

**Expected Results:**
- Application updated
- New redirect URI saved

#### 3.4 Delete Application
```
1. Click delete icon on an application
2. Confirm deletion
```

**Expected Results:**
- Application removed from list

**API Endpoints Used:**
- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/{id}`
- `POST /api/applications/{id}/regenerate-secret`
- `DELETE /api/applications/{id}`

---

## FLOW 4: User Management

### Prerequisites
- Logged in user
- At least one tenant exists

### Test Steps

#### 4.1 Create User
```
1. Navigate to /users
2. Click "Create User" button
3. Fill form:
   - Tenant: Select from dropdown
   - Login ID: "testuser"
   - Full Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "Test123!"
   - Company: "Test Corp"
   - Designation: "Developer"
4. Click "Create"
```

**Expected Results:**
- User appears in list
- User status shows as "Pending" (not approved)

#### 4.2 View User Details
```
1. Click on a user row to open details modal
2. Review Information tab
3. Review Security tab
4. Review Activity tab
```

**Expected Results:**
- User info displayed correctly
- Security options visible
- Activity logs shown (if any)

#### 4.3 Lock/Unlock User
```
1. Open user details modal
2. Go to Security tab
3. Click "Lock Account" button
4. Verify user shows as locked
5. Click "Unlock Account"
6. Verify user shows as unlocked
```

**Expected Results:**
- Lock status toggles correctly
- List updates to reflect status

#### 4.4 Admin Password Reset
```
1. Open user details modal
2. Go to Security tab
3. Click "Reset Password"
4. Enter new password in dialog
5. Confirm
```

**Expected Results:**
- Password reset successfully
- User can login with new password

#### 4.5 Send Password Reset Link
```
1. Open user details modal
2. Go to Security tab
3. Click "Send Reset Link"
4. Confirm
```

**Expected Results:**
- Email sent to user
- Success message displayed

#### 4.6 View Activity Logs
```
1. Open user details modal
2. Go to Activity tab
3. Review activity entries
```

**Expected Results:**
- Activities listed with:
  - Timestamp
  - Action
  - Resource
  - IP Address

#### 4.7 Delete User
```
1. In user list, click delete icon
2. Confirm deletion
```

**Expected Results:**
- User removed from list

**API Endpoints Used:**
- `GET /api/users`
- `POST /api/auth/register`
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`
- `PUT /api/users/{id}/lock-status`
- `POST /api/users/{id}/reset-password`
- `POST /api/users/{id}/send-reset-link`
- `GET /api/users/{id}/activity-logs`

---

## FLOW 5: Role & Permission Management

### Prerequisites
- Logged in user
- At least one tenant and application exist

### Test Steps

#### 5.1 Create Role with Permissions
```
1. Navigate to /roles
2. Click "Create Role" button
3. Fill form:
   - Tenant: Select from dropdown
   - Application: Select from dropdown
   - Name: "Content Manager"
   - Description: "Manages content"
4. In permissions section:
   - Expand "users" resource
   - Check "read" permission
   - Expand "menus" resource
   - Check "read" and "write" permissions
5. Click "Create"
```

**Expected Results:**
- Role appears in list
- Role has selected permissions

#### 5.2 View Role Permissions
```
1. Click on a role to view details
2. Review assigned permissions
```

**Expected Results:**
- All assigned permissions displayed

#### 5.3 Modify Role Permissions
```
1. Click edit on a role
2. Add or remove permissions
3. Save changes
```

**Expected Results:**
- Permission changes saved
- Role updated

#### 5.4 Delete Role
```
1. Click delete icon on a role
2. Confirm deletion
```

**Expected Results:**
- Role removed from list
- Associated user-role assignments removed

**API Endpoints Used:**
- `GET /api/roles`
- `POST /api/roles`
- `GET /api/roles/{id}`
- `PUT /api/roles/{id}`
- `DELETE /api/roles/{id}`
- `GET /api/permissions`
- `POST /api/roles/{id}/permissions`
- `DELETE /api/roles/{id}/permissions/{permissionId}`

---

## FLOW 6: User-Role Assignment

### Prerequisites
- Logged in user
- At least one user and role exist

### Test Steps

#### 6.1 Assign Role to User
```
1. Navigate to /user-roles
2. Search for user in left panel
3. Click on user to select
4. In right panel, find available role
5. Click "+" button to assign
```

**Expected Results:**
- Role moves to "Assigned Roles" section
- Success notification

#### 6.2 Remove Role from User
```
1. Select user with assigned roles
2. In "Assigned Roles" section
3. Click "-" button on a role
```

**Expected Results:**
- Role moves to "Available Roles" section
- Success notification

**API Endpoints Used:**
- `GET /api/users`
- `GET /api/roles`
- `GET /api/users/{id}/roles`
- `POST /api/users/{id}/roles`
- `DELETE /api/users/{id}/roles/{roleId}`

---

## FLOW 7: Menu Management

### Prerequisites
- Logged in user
- At least one application exists

### Test Steps

#### 7.1 Create Menu Item
```
1. Navigate to /menus
2. Select application from dropdown
3. Click "Create Menu" button
4. Fill form:
   - Label: "Dashboard"
   - Path: "/dashboard"
   - Icon: "LayoutDashboard"
   - Order: 1
   - Parent: (none)
   - Required Permission: (optional)
5. Click "Create"
```

**Expected Results:**
- Menu item appears in list

#### 7.2 Create Child Menu
```
1. Click "Create Menu" button
2. Fill form:
   - Label: "Analytics"
   - Path: "/dashboard/analytics"
   - Parent: Select "Dashboard"
   - Order: 1
3. Click "Create"
```

**Expected Results:**
- Child menu appears under parent
- Hierarchy indicated in list

#### 7.3 Bulk Import Menus
```
1. Prepare JSON file:
{
  "menus": [
    { "label": "Users", "path": "/users", "order": 2 },
    { "label": "Settings", "path": "/settings", "order": 3 }
  ]
}
2. Click "Import" button
3. Select JSON file
4. Confirm import
```

**Expected Results:**
- Multiple menus created
- All appear in list

#### 7.4 Delete Menu
```
1. Click delete icon on a menu (without children)
2. Confirm deletion
```

**Expected Results:**
- Menu removed from list

**Note:** Cannot delete menu with children - must delete children first.

**API Endpoints Used:**
- `GET /api/menus`
- `POST /api/menus`
- `POST /api/menus/bulk`
- `PUT /api/menus/{id}`
- `DELETE /api/menus/{id}`

---

## FLOW 8: Organization Management

### Prerequisites
- Logged in user

### Test Steps

#### 8.1 Create Organization
```
1. Navigate to /organizations
2. Click "Create Organization" button
3. Fill form:
   - Name: "Headquarters"
   - Description: "Main office"
   - Parent: (none)
4. Click "Create"
```

**Expected Results:**
- Organization appears in list

#### 8.2 Create Child Organization
```
1. Click "Create Organization"
2. Fill form:
   - Name: "Engineering"
   - Description: "Engineering department"
   - Parent: Select "Headquarters"
3. Click "Create"
```

**Expected Results:**
- Child org appears under parent
- Tree view shows hierarchy

#### 8.3 View Organization Tree
```
1. Toggle to "Tree View"
2. Observe hierarchical structure
```

**Expected Results:**
- Organizations displayed in tree format
- Levels properly indicated

#### 8.4 Assign User to Organization
```
1. Click on an organization to view users
2. Click "Add User" button
3. Select user from dropdown
4. Confirm
```

**Expected Results:**
- User appears in organization's user list

#### 8.5 Remove User from Organization
```
1. In organization's user list
2. Click remove icon on user
3. Confirm
```

**Expected Results:**
- User removed from organization

#### 8.6 Delete Organization
```
1. Click delete on org (without children or users)
2. Confirm
```

**Expected Results:**
- Organization removed

**Note:** Cannot delete org with children or assigned users.

**API Endpoints Used:**
- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/{id}`
- `GET /api/organizations/{id}/tree`
- `PUT /api/organizations/{id}`
- `DELETE /api/organizations/{id}`
- `GET /api/organizations/{id}/users`
- `POST /api/organizations/{id}/users`
- `DELETE /api/organizations/users/{userId}`

---

## FLOW 9: Session Management

### Prerequisites
- Logged in user (preferably from multiple devices/browsers)

### Test Steps

#### 9.1 View Active Sessions
```
1. Navigate to /sessions
2. View list of active sessions
```

**Expected Results:**
- Current session highlighted
- Each session shows:
  - Device type (Desktop/Mobile/Tablet)
  - Browser
  - Operating System
  - IP Address
  - Login time
  - Last activity

#### 9.2 Revoke Specific Session
```
1. Click "Revoke" on a session (not current)
2. Confirm revocation
```

**Expected Results:**
- Session removed from list
- If that was another logged-in device, it's now logged out

#### 9.3 Revoke All Sessions
```
1. Click "Revoke All Sessions" button
2. Confirm
```

**Expected Results:**
- All sessions revoked
- Current user logged out
- Redirected to login page

**API Endpoints Used:**
- `GET /api/sessions/my`
- `DELETE /api/sessions/{sessionToken}`
- `DELETE /api/sessions/my/all`

---

## FLOW 10: Dashboard Statistics

### Prerequisites
- Logged in user

### Test Steps

```
1. Navigate to / (dashboard)
2. Observe statistics cards
3. Observe recent activity list
```

**Expected Results:**
- Cards show:
  - Total Tenants count
  - Active Applications count
  - Registered Users count
  - System Roles count
- Recent activity shows last 10 actions

**API Endpoints Used:**
- `GET /api/dashboard/stats`

---

## INTEGRATION TEST: Complete User Journey

### Scenario: Onboard New Tenant with Users and Roles

```
1. Login as super admin
2. Create new tenant "Acme Corp"
3. Create application "Acme Portal" for tenant
4. Create roles: "Admin", "User"
5. Add permissions to Admin role
6. Create user "john@acme.com" in tenant
7. Assign "Admin" role to John
8. Verify John appears in tenant user list
9. Verify John has Admin role assigned
10. Logout
11. Login as John
12. Verify John can access dashboard
13. Verify John sees appropriate menu items
```

**This tests:**
- Multi-tenant isolation
- Role-based access
- Complete user lifecycle

---

## API-ONLY TEST FLOWS (No UI)

### 2FA Setup (Server-Only)
```bash
# Generate 2FA secret
POST /api/2fa/generate
Authorization: Bearer {token}

# Response: { secret, qrCode (base64) }

# Verify and enable
POST /api/2fa/verify
{ "token": "123456" }

# Disable
POST /api/2fa/disable
{ "token": "123456" }
```

### Password Recovery (Server-Only)
```bash
# Request reset
POST /api/password/forgot-password
{ "email": "user@example.com", "tenantId": "..." }

# Validate token
GET /api/password/validate-token?token=xxx

# Reset password
POST /api/password/reset-password
{ "token": "xxx", "newPassword": "newpass123" }
```

### Email Verification (Server-Only)
```bash
# Verify via POST
POST /api/auth/verify-email
{ "token": "xxx" }

# Or via GET (link click)
GET /api/auth/verify-email/{token}

# Resend verification
POST /api/auth/resend-verification
Authorization: Bearer {token}

# Check status
GET /api/auth/verification-status
Authorization: Bearer {token}
```

---

## Test Data Setup

### Default Seed Data
```
Tenant: Default (ID: 1)
User: bd@gmail.com / 1q2w3E*
```

### Recommended Test Data
```sql
-- Create via API or Prisma Studio

-- Additional tenants
POST /api/tenants { name: "Test Corp", domain: "test-corp" }
POST /api/tenants { name: "Demo Inc", domain: "demo-inc" }

-- Additional users in each tenant
POST /api/auth/register {
  email: "admin@test-corp.com",
  password: "Admin123!",
  userName: "Test Admin",
  tenantId: "{test-corp-id}"
}
```

---

## Troubleshooting Test Failures

### Common Issues

1. **401 Unauthorized**
   - Token expired - login again
   - Token not included in request

2. **403 Forbidden**
   - User lacks required permission
   - Cross-tenant access attempted

3. **404 Not Found**
   - Resource doesn't exist
   - Wrong tenant context

4. **Validation Errors**
   - Check required fields
   - Check field format (email, URL, etc.)

### Debug Tools
- **Prisma Studio**: `npx prisma studio` at http://localhost:5555
- **API Docs**: https://localhost:3000/api-docs
- **Browser DevTools**: Network tab for API calls
- **Server Logs**: Check terminal running `npm run dev`
