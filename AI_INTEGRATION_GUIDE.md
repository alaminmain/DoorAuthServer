# DoorAuth Integration Prompts

This guide is designed for AI agents to easily integrate new applications with the DoorAuth system using bulk operations.

## 1. Register Application
**Context**: You need to register a new client application.
**Action**: Create a registration script or insert into DB.
**Script**: `server/scripts/register-app.ts` (Template)
```typescript
{
    "name": "App Name",
    "clientId": "app-client-id",
    "clientSecret": "secret",
    "redirectUris": "http://localhost:PORT/callback"
}
```

## 2. Define Permissions
**Context**: Add application-specific permissions.
**File**: `server/src/config/permissions.ts`
**Action**: Append to `SYSTEM_PERMISSIONS` array.
```typescript
{ resource: 'myapp', action: 'read', description: 'Read myapp data' },
{ resource: 'myapp', action: 'write', description: 'Write myapp data' }
```

## 3. Bulk Create Roles
**Context**: Create multiple roles for the application at once.
**Endpoint**: `POST /api/roles/bulk`
**Headers**: `Authorization: Bearer <admin_token>`
**Body**:
```json
{
  "tenantId": "target_tenant_id",
  "roles": [
    {
      "name": "App Admin",
      "description": "Administrator for App",
      "applicationId": "target_app_id",
      "permissionIds": ["myapp:read", "myapp:write"]
    },
    {
      "name": "App User",
      "description": "Standard User",
      "applicationId": "target_app_id",
      "permissionIds": ["myapp:read"]
    }
  ]
}
```

## 4. Bulk Create Menus
**Context**: Define the menu structure for the application.
**Endpoint**: `POST /api/menus/bulk`
**Headers**: `Authorization: Bearer <admin_token>`
**Body**:
```json
{
  "applicationId": "target_app_id",
  "menus": [
    {
      "label": "Dashboard",
      "path": "/dashboard",
      "icon": "layout-dashboard",
      "order": 1,
      "requiredPermission": "myapp:read"
    },
    {
      "label": "Settings",
      "path": "/settings",
      "icon": "settings",
      "order": 99,
      "requiredPermission": "myapp:write"
    }
  ]
}
```

## 5. Bulk Create Users
**Context**: Provision initial users.
**Endpoint**: `POST /api/users/bulk`
**Headers**: `Authorization: Bearer <admin_token>`
**Body**:
```json
{
  "tenantId": "target_tenant_id",
  "users": [
    {
      "email": "admin@myapp.com",
      "userName": "App Admin",
      "password": "InitialPassword123!",
      "designation": "Administrator",
      "isApproved": true
    },
    {
      "email": "user@myapp.com",
      "userName": "App User",
      "password": "InitialPassword123!",
      "designation": "Staff",
      "isApproved": true
    }
  ]
}
```
