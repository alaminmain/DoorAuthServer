# Quick Reference: Creating Tenant Admin

## 🚀 Fastest Methods

### Method 1: Database Seed Script (Recommended for Development)
```bash
cd server
npm run seed:admin
```

**With custom values:**
```bash
TENANT_ID=my-company \
ADMIN_EMAIL=admin@mycompany.com \
ADMIN_PASSWORD=SecurePass123! \
TENANT_NAME="My Company" \
TENANT_DOMAIN=mycompany.com \
npm run seed:admin
```

### Method 2: PowerShell Script (Recommended for Production)
```powershell
cd server\scripts
.\create-admin.ps1
```

**With custom values:**
```powershell
.\create-admin.ps1 `
  -TenantId "my-company" `
  -AdminEmail "admin@mycompany.com" `
  -AdminPassword "SecurePass123!" `
  -AdminName "Company Administrator"
```

### Method 3: API Call (Manual)
```bash
# 1. Register user
curl -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "userName": "Admin User",
    "tenantId": "your-tenant-id"
  }'

# 2. Use the token from response to create role and assign permissions
# (See full documentation for complete steps)
```

---

## 📋 Default Credentials

After running seed script:
- **Email**: `admin@doorauth.local`
- **Password**: `Admin123!`
- **Tenant ID**: `default-tenant`

---

## ✅ Verification

### Login Test
```bash
curl -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@doorauth.local",
    "password": "Admin123!"
  }'
```

### Check User Roles
```bash
# Get token from login, then:
curl https://localhost:3000/api/users/{userId}/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔐 Admin Permissions

A Tenant Admin has these permissions:
- ✅ users:read, users:write
- ✅ applications:read, applications:write
- ✅ roles:read, roles:write
- ✅ menus:read, menus:write
- ✅ organizations:read, organizations:write
- ✅ tenants:read
- ✅ audit-logs:read

---

## 🌐 Access Points

- **UI**: https://localhost:5173
- **API**: https://localhost:3000
- **API Docs**: https://localhost:3000/api-docs

---

## 📚 Full Documentation

See `CREATING_TENANT_ADMIN.md` for:
- Detailed step-by-step instructions
- Multiple creation methods
- Troubleshooting guide
- Security best practices
- Complete API examples

---

## 🆘 Common Issues

**"User already exists"**
→ Use different email or update existing user

**"Invalid credentials"**
→ Check password, account lock status, approval status

**"Insufficient permissions"**
→ Verify role assignment and permissions

**Server not responding**
→ Ensure server is running: `npm run dev`

---

## 🎯 Quick Start Workflow

1. **Create Admin**: `npm run seed:admin`
2. **Login**: Navigate to https://localhost:5173
3. **Create App**: Go to Applications → New Application
4. **Define Roles**: Go to Roles → New Role
5. **Build Menus**: Go to Menu Builder → Add Menu Item
6. **Add Users**: Go to Users → New User
7. **Assign Roles**: Go to User Roles → Select User → Assign

---

**You're ready to manage your DoorAuth tenant!** 🎉
