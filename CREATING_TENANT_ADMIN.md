# How to Create a Tenant Admin User

## Overview
This guide explains the different methods to create a tenant admin user in the DoorAuth system. A tenant admin has full control over their tenant's users, applications, roles, and permissions.

---

## 🎯 **Quick Summary**

There are **3 main approaches** to create a tenant admin:

1. **API Registration** (Recommended for first admin)
2. **Database Seeding** (For development/testing)
3. **UI-based Creation** (After first admin exists)

---

## Method 1: API Registration (Recommended)

### **Step 1: Register the User**

Use the `/api/auth/register` endpoint to create the first user:

```bash
POST https://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "userName": "Admin User",
  "tenantId": "your-tenant-id"
}
```

**Using cURL:**
```bash
curl -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "userName": "Admin User",
    "tenantId": "your-tenant-id"
  }'
```

**Using PowerShell:**
```powershell
$body = @{
    email = "admin@example.com"
    password = "SecurePassword123!"
    userName = "Admin User"
    tenantId = "your-tenant-id"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://localhost:3000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -SkipCertificateCheck
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "userName": "Admin User",
      "tenantId": "your-tenant-id",
      "isApproved": true
    },
    "token": "jwt-token-here"
  }
}
```

### **Step 2: Create "Tenant Admin" Role**

```bash
POST https://localhost:3000/api/roles
Authorization: Bearer <token-from-registration>
Content-Type: application/json

{
  "name": "Tenant Admin",
  "description": "Full administrative access to tenant",
  "tenantId": "your-tenant-id"
}
```

**Using cURL:**
```bash
curl -X POST https://localhost:3000/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tenant Admin",
    "description": "Full administrative access to tenant",
    "tenantId": "your-tenant-id"
  }'
```

### **Step 3: Add Permissions to the Role**

```bash
POST https://localhost:3000/api/roles/{roleId}/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissions": [
    { "resource": "users", "action": "read" },
    { "resource": "users", "action": "write" },
    { "resource": "applications", "action": "read" },
    { "resource": "applications", "action": "write" },
    { "resource": "roles", "action": "read" },
    { "resource": "roles", "action": "write" },
    { "resource": "menus", "action": "read" },
    { "resource": "menus", "action": "write" },
    { "resource": "organizations", "action": "read" },
    { "resource": "organizations", "action": "write" }
  ]
}
```

### **Step 4: Assign Role to User**

```bash
POST https://localhost:3000/api/users/{userId}/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "role-id-from-step-2"
}
```

---

## Method 2: Database Seeding Script

Create a seeding script to automatically set up tenant admin users.

### **Create Seed Script**

Create `server/src/scripts/seed-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedTenantAdmin() {
  const tenantId = process.env.TENANT_ID || 'default-tenant-id';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  console.log('🌱 Seeding Tenant Admin...');

  // 1. Create or get tenant
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Default Tenant',
        domain: 'default.example.com'
      }
    });
    console.log('✅ Created tenant:', tenant.name);
  }

  // 2. Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: adminEmail
      }
    },
    update: {},
    create: {
      email: adminEmail,
      loginId: adminEmail,
      userName: 'Tenant Administrator',
      passwordHash,
      tenantId: tenant.id,
      isApproved: true,
      isLocked: false
    }
  });
  console.log('✅ Created admin user:', adminUser.email);

  // 3. Create Tenant Admin role
  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Tenant Admin'
      }
    },
    update: {},
    create: {
      name: 'Tenant Admin',
      description: 'Full administrative access to tenant',
      tenantId: tenant.id,
      isSystem: true,
      status: 'active'
    }
  });
  console.log('✅ Created Tenant Admin role');

  // 4. Add permissions to role
  const permissions = [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'write' },
    { resource: 'applications', action: 'read' },
    { resource: 'applications', action: 'write' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'write' },
    { resource: 'menus', action: 'read' },
    { resource: 'menus', action: 'write' },
    { resource: 'organizations', action: 'read' },
    { resource: 'organizations', action: 'write' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        roleId_resource_action: {
          roleId: adminRole.id,
          resource: perm.resource,
          action: perm.action
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        resource: perm.resource,
        action: perm.action
      }
    });
  }
  console.log('✅ Added permissions to role');

  // 5. Assign role to user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id
    }
  });
  console.log('✅ Assigned role to admin user');

  console.log('\n🎉 Tenant Admin seeded successfully!');
  console.log('📧 Email:', adminEmail);
  console.log('🔑 Password:', adminPassword);
  console.log('🏢 Tenant:', tenant.name);
}

seedTenantAdmin()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### **Add Script to package.json**

```json
{
  "scripts": {
    "seed:admin": "ts-node src/scripts/seed-admin.ts"
  }
}
```

### **Run the Seed Script**

```bash
# Using environment variables
TENANT_ID=my-tenant \
ADMIN_EMAIL=admin@mycompany.com \
ADMIN_PASSWORD=SecurePass123! \
npm run seed:admin

# Or with defaults
npm run seed:admin
```

---

## Method 3: UI-Based Creation (After First Admin)

Once you have at least one tenant admin, you can create additional admins through the UI:

### **Step 1: Login to DoorAuth Client**
1. Navigate to `https://localhost:5173` (or your client URL)
2. Login with your admin credentials

### **Step 2: Create the User**
1. Go to **Users** page
2. Click **"New User"**
3. Fill in the form:
   - Login ID: `admin2@example.com`
   - User Name: `Second Admin`
   - Email: `admin2@example.com`
   - Password: `SecurePassword123!`
   - Company Name: (optional)
   - Designation: `Administrator`
4. Click **"Create"**

### **Step 3: Assign Admin Role**
1. Go to **User Roles** page
2. Select the newly created user from the left panel
3. In the "Available Roles" section, find "Tenant Admin"
4. Click the **✓** (check) button to assign the role

### **Step 4: Verify**
1. Logout
2. Login with the new admin credentials
3. Verify access to all admin features

---

## 🔐 **Default Permissions for Tenant Admin**

A Tenant Admin should have these permissions:

| Resource | Actions | Description |
|----------|---------|-------------|
| **users** | read, write | Manage users |
| **applications** | read, write | Manage applications |
| **roles** | read, write | Manage roles |
| **menus** | read, write | Manage menus |
| **organizations** | read, write | Manage organizations |
| **tenants** | read | View tenant info |
| **audit-logs** | read | View audit logs |

---

## 📋 **Complete PowerShell Script**

Here's a complete PowerShell script to create a tenant admin:

```powershell
# Configuration
$baseUrl = "https://localhost:3000/api"
$tenantId = "your-tenant-id"
$adminEmail = "admin@example.com"
$adminPassword = "SecurePassword123!"
$adminName = "Tenant Administrator"

# Step 1: Register User
Write-Host "Creating admin user..." -ForegroundColor Cyan
$registerBody = @{
    email = $adminEmail
    password = $adminPassword
    userName = $adminName
    tenantId = $tenantId
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $registerBody `
    -SkipCertificateCheck

$token = $registerResponse.data.token
$userId = $registerResponse.data.user.id
Write-Host "✅ User created: $userId" -ForegroundColor Green

# Step 2: Create Tenant Admin Role
Write-Host "Creating Tenant Admin role..." -ForegroundColor Cyan
$roleBody = @{
    name = "Tenant Admin"
    description = "Full administrative access to tenant"
    tenantId = $tenantId
} | ConvertTo-Json

$roleResponse = Invoke-RestMethod -Uri "$baseUrl/roles" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body $roleBody `
    -SkipCertificateCheck

$roleId = $roleResponse.data.id
Write-Host "✅ Role created: $roleId" -ForegroundColor Green

# Step 3: Add Permissions
Write-Host "Adding permissions to role..." -ForegroundColor Cyan
$permissions = @(
    @{ resource = "users"; action = "read" }
    @{ resource = "users"; action = "write" }
    @{ resource = "applications"; action = "read" }
    @{ resource = "applications"; action = "write" }
    @{ resource = "roles"; action = "read" }
    @{ resource = "roles"; action = "write" }
    @{ resource = "menus"; action = "read" }
    @{ resource = "menus"; action = "write" }
    @{ resource = "organizations"; action = "read" }
    @{ resource = "organizations"; action = "write" }
)

foreach ($perm in $permissions) {
    $permBody = $perm | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/roles/$roleId/permissions" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $token" } `
        -ContentType "application/json" `
        -Body $permBody `
        -SkipCertificateCheck | Out-Null
}
Write-Host "✅ Permissions added" -ForegroundColor Green

# Step 4: Assign Role to User
Write-Host "Assigning role to user..." -ForegroundColor Cyan
$assignBody = @{ roleId = $roleId } | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/users/$userId/roles" `
    -Method POST `
    -Headers @{ Authorization = "Bearer $token" } `
    -ContentType "application/json" `
    -Body $assignBody `
    -SkipCertificateCheck | Out-Null

Write-Host "✅ Role assigned" -ForegroundColor Green

Write-Host "`n🎉 Tenant Admin created successfully!" -ForegroundColor Green
Write-Host "📧 Email: $adminEmail" -ForegroundColor Yellow
Write-Host "🔑 Password: $adminPassword" -ForegroundColor Yellow
Write-Host "🏢 Tenant ID: $tenantId" -ForegroundColor Yellow
```

**Save as:** `create-admin.ps1`

**Run:**
```powershell
.\create-admin.ps1
```

---

## 🔍 **Verify Admin User**

### **Check via API**
```bash
# Login
POST https://localhost:3000/api/auth/login
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}

# Get user roles
GET https://localhost:3000/api/users/{userId}/roles
Authorization: Bearer <token>
```

### **Check via Database**
```sql
-- Check user
SELECT * FROM users WHERE email = 'admin@example.com';

-- Check user roles
SELECT u.email, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id
WHERE u.email = 'admin@example.com';

-- Check role permissions
SELECT r.name as role_name, p.resource, p.action
FROM roles r
JOIN permissions p ON r.id = p.roleId
WHERE r.name = 'Tenant Admin';
```

---

## 🚀 **Quick Start (Recommended)**

For the fastest setup:

1. **Use the PowerShell script** above
2. **Or use the seed script** for development
3. **Then use the UI** to create additional admins

---

## 📝 **Important Notes**

1. **First Admin**: Use API or seed script for the very first admin
2. **Subsequent Admins**: Use the UI (easier and safer)
3. **Security**: Always use strong passwords
4. **Tenant ID**: Make sure you have the correct tenant ID
5. **Permissions**: Verify all permissions are assigned correctly
6. **Testing**: Test login and access before deploying

---

## 🆘 **Troubleshooting**

### **"User already exists"**
- Check if the email is already registered
- Use a different email or update the existing user

### **"Invalid credentials"**
- Verify the password is correct
- Check if the account is locked (`isLocked = false`)
- Check if the account is approved (`isApproved = true`)

### **"Insufficient permissions"**
- Verify the role has all required permissions
- Check if the role is assigned to the user
- Ensure the role status is 'active'

### **Cannot access admin features**
- Check user roles: `GET /api/users/{userId}/roles`
- Verify role permissions: `GET /api/roles/{roleId}/permissions`
- Check JWT token includes correct claims

---

## ✅ **Success Checklist**

- [ ] User created successfully
- [ ] "Tenant Admin" role created
- [ ] All permissions added to role
- [ ] Role assigned to user
- [ ] User can login
- [ ] User can access all admin pages
- [ ] User can create other users
- [ ] User can manage applications
- [ ] User can manage roles
- [ ] User can manage menus

---

## 🎯 **Next Steps**

After creating your tenant admin:

1. **Login to the UI** at `https://localhost:5173`
2. **Create your first application**
3. **Define additional roles** (e.g., "User", "Manager")
4. **Build menu structures** for your applications
5. **Create organizational hierarchy** (if needed)
6. **Onboard regular users**

---

**You're now ready to fully manage your DoorAuth tenant!** 🎉
