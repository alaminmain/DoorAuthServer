# RBAC Implementation Patterns

## Database Schema

### Prisma Schema

```prisma
model Permission {
  id          Int              @id @default(autoincrement())
  name        String           @unique  // e.g., "users.create"
  description String?
  category    String           // e.g., "Users", "Roles"
  roles       RolePermission[]
  createdAt   DateTime         @default(now())
}

model Role {
  id          Int              @id @default(autoincrement())
  name        String
  description String?
  tenantId    Int
  tenant      Tenant           @relation(fields: [tenantId], references: [id])
  isSystem    Boolean          @default(false)
  permissions RolePermission[]
  users       UserRole[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([tenantId, name])
}

model RolePermission {
  id           Int        @id @default(autoincrement())
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
}

model UserRole {
  id     Int  @id @default(autoincrement())
  userId Int
  roleId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
}
```

---

## Permission Definitions

### Centralized Permission Config

```typescript
// src/config/permissions.ts
export const PERMISSIONS = {
  // User management
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ASSIGN_ROLES: 'users.assign_roles',

  // Role management
  ROLES_CREATE: 'roles.create',
  ROLES_READ: 'roles.read',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ASSIGN_PERMISSIONS: 'roles.assign_permissions',

  // Application management
  APPS_CREATE: 'applications.create',
  APPS_READ: 'applications.read',
  APPS_UPDATE: 'applications.update',
  APPS_DELETE: 'applications.delete',

  // Tenant management (super admin)
  TENANTS_CREATE: 'tenants.create',
  TENANTS_READ: 'tenants.read',
  TENANTS_UPDATE: 'tenants.update',
  TENANTS_DELETE: 'tenants.delete'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  Users: [
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_ASSIGN_ROLES
  ],
  Roles: [
    PERMISSIONS.ROLES_CREATE,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.ROLES_DELETE,
    PERMISSIONS.ROLES_ASSIGN_PERMISSIONS
  ],
  Applications: [
    PERMISSIONS.APPS_CREATE,
    PERMISSIONS.APPS_READ,
    PERMISSIONS.APPS_UPDATE,
    PERMISSIONS.APPS_DELETE
  ]
};
```

---

## Permission Checking

### Service Layer

```typescript
// src/services/permission.service.ts
export class PermissionService {
  async getUserPermissions(userId: number, tenantId: number): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        role: { tenantId }
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.name);
      }
    }

    return Array.from(permissions);
  }

  async hasPermission(
    userId: number,
    tenantId: number,
    permission: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, tenantId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(
    userId: number,
    tenantId: number,
    permissions: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    return permissions.some(p => userPermissions.includes(p));
  }

  async hasAllPermissions(
    userId: number,
    tenantId: number,
    permissions: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    return permissions.every(p => userPermissions.includes(p));
  }
}
```

### Caching Permissions

```typescript
// Cache user permissions in Redis
export class CachedPermissionService extends PermissionService {
  private readonly CACHE_TTL = 300; // 5 minutes

  async getUserPermissions(userId: number, tenantId: number): Promise<string[]> {
    const cacheKey = `permissions:${tenantId}:${userId}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const permissions = await super.getUserPermissions(userId, tenantId);

    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(permissions));

    return permissions;
  }

  async invalidateCache(userId: number, tenantId: number): Promise<void> {
    const cacheKey = `permissions:${tenantId}:${userId}`;
    await redis.del(cacheKey);
  }
}
```

---

## Middleware Implementation

### Permission Middleware

```typescript
// src/middlewares/permission.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service';

const permissionService = new PermissionService();

export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const tenantId = req.tenantId;

    if (!user || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasPermission = await permissionService.hasAnyPermission(
      user.id,
      tenantId,
      permissions
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions
      });
    }

    next();
  };
}

export function requireAllPermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const tenantId = req.tenantId;

    if (!user || !tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasAll = await permissionService.hasAllPermissions(
      user.id,
      tenantId,
      permissions
    );

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions
      });
    }

    next();
  };
}
```

### Route Usage

```typescript
// src/routes/user.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requirePermission } from '../middlewares/permission.middleware';
import { PERMISSIONS } from '../config/permissions';
import * as userController from '../controllers/user.controller';

const router = Router();

// Apply auth to all routes
router.use(authenticate);

// CRUD with permission checks
router.get(
  '/',
  requirePermission(PERMISSIONS.USERS_READ),
  userController.getUsers
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.USERS_READ),
  userController.getUser
);

router.post(
  '/',
  requirePermission(PERMISSIONS.USERS_CREATE),
  userController.createUser
);

router.put(
  '/:id',
  requirePermission(PERMISSIONS.USERS_UPDATE),
  userController.updateUser
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.USERS_DELETE),
  userController.deleteUser
);

router.post(
  '/:id/roles',
  requirePermission(PERMISSIONS.USERS_ASSIGN_ROLES),
  userController.assignRoles
);

export default router;
```

---

## Role Management

### Default Roles

```typescript
// src/services/role.service.ts
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access',
    permissions: Object.values(PERMISSIONS)
  },
  ADMIN: {
    name: 'Admin',
    description: 'Tenant administrator',
    permissions: [
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DELETE,
      PERMISSIONS.USERS_ASSIGN_ROLES,
      PERMISSIONS.ROLES_READ,
      PERMISSIONS.APPS_READ
    ]
  },
  USER: {
    name: 'User',
    description: 'Standard user',
    permissions: [
      PERMISSIONS.USERS_READ // Can only view own profile
    ]
  }
};

export async function seedDefaultRoles(tenantId: number) {
  for (const [key, role] of Object.entries(DEFAULT_ROLES)) {
    const created = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: role.name } },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        tenantId,
        isSystem: true
      }
    });

    // Assign permissions
    for (const permName of role.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: created.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: created.id,
            permissionId: permission.id
          }
        });
      }
    }
  }
}
```

---

## Hierarchical Permissions

### Permission Inheritance

```typescript
// Wildcard permission checking
function matchesPermission(userPerm: string, required: string): boolean {
  // Exact match
  if (userPerm === required) return true;

  // Wildcard match (e.g., "users.*" matches "users.create")
  if (userPerm.endsWith('.*')) {
    const prefix = userPerm.slice(0, -1);
    return required.startsWith(prefix);
  }

  // Super admin wildcard
  if (userPerm === '*') return true;

  return false;
}

async function hasPermissionWithWildcard(
  userId: number,
  tenantId: number,
  permission: string
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, tenantId);
  return userPermissions.some(p => matchesPermission(p, permission));
}
```

---

## Frontend Permission Checks

### React Hook

```typescript
// hooks/usePermissions.ts
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(p => permissions.includes(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions };
}
```

### Permission Guard Component

```tsx
// components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const perms = Array.isArray(permission) ? permission : [permission];

  const hasAccess = requireAll
    ? hasAllPermissions(perms)
    : hasAnyPermission(perms);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage
<PermissionGuard permission="users.create">
  <CreateUserButton />
</PermissionGuard>

<PermissionGuard
  permission={['users.update', 'users.delete']}
  requireAll
  fallback={<span>No access</span>}
>
  <UserActions />
</PermissionGuard>
```
