/**
 * Permission Middleware Example
 * Express middleware for RBAC permission checking
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Cache permissions in memory for performance
const permissionCache = new Map<string, { permissions: string[]; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user permissions with caching
 */
async function getUserPermissions(
  userId: string,
  tenantId: number
): Promise<string[]> {
  const cacheKey = `${tenantId}:${userId}`;
  const cached = permissionCache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.permissions;
  }

  // Fetch from database
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: parseInt(userId),
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

  const permArray = Array.from(permissions);

  // Cache result
  permissionCache.set(cacheKey, {
    permissions: permArray,
    expiry: Date.now() + CACHE_TTL
  });

  return permArray;
}

/**
 * Invalidate permission cache for user
 */
export function invalidatePermissionCache(userId: string, tenantId: number): void {
  const cacheKey = `${tenantId}:${userId}`;
  permissionCache.delete(cacheKey);
}

/**
 * Check if user has required permission (supports wildcards)
 */
function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.some(p => {
    if (p === required) return true;
    if (p === '*') return true;
    if (p.endsWith('.*')) {
      const prefix = p.slice(0, -1);
      return required.startsWith(prefix);
    }
    return false;
  });
}

/**
 * Middleware factory: require ANY of the specified permissions
 */
export function requirePermission(...permissions: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || !req.tenantId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userPermissions = await getUserPermissions(
      req.user.sub,
      req.tenantId
    );

    const hasAny = permissions.some(p => hasPermission(userPermissions, p));

    if (!hasAny) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions,
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory: require ALL specified permissions
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user || !req.tenantId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const userPermissions = await getUserPermissions(
      req.user.sub,
      req.tenantId
    );

    const hasAll = permissions.every(p => hasPermission(userPermissions, p));

    if (!hasAll) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: permissions,
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory: require specific role
 */
export function requireRole(...roles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const hasRole = req.user.roles.some(r =>
      roles.includes(r.toLowerCase())
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: 'Insufficient role',
        required: roles,
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
}

/**
 * Usage example in routes:
 *
 * router.get('/users', requirePermission('users.read'), getUsers);
 * router.post('/users', requirePermission('users.create'), createUser);
 * router.delete('/users/:id', requireAllPermissions('users.delete', 'users.read'), deleteUser);
 * router.get('/admin', requireRole('admin', 'super_admin'), adminDashboard);
 */
