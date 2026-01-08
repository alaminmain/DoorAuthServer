import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';
import { formatPermission } from '../config/permissions';

const prisma = new PrismaClient();

/**
 * Extended Request type with user information
 */
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        tenantId: string;
        email: string;
        roles?: string[];
        permissions?: string[];
    };
}

/**
 * Middleware to check if user has a specific permission
 * Usage: requirePermission('users', 'read')
 */
export function requirePermission(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;

            if (!authReq.user) {
                res.status(401).json(ApiResponse.error('Unauthorized: No user found in request'));
                return;
            }

            const { userId, tenantId } = authReq.user;

            // Get user's roles with permissions
            const userRoles = await prisma.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });

            // Flatten all permissions
            const userPermissions = userRoles.flatMap(ur =>
                ur.role.permissions.map(p => formatPermission(p.resource, p.action))
            );

            const requiredPermission = formatPermission(resource, action);

            if (!userPermissions.includes(requiredPermission)) {
                Logger.warn('Permission denied', {
                    userId,
                    tenantId,
                    requiredPermission,
                    userPermissions
                });

                res.status(403).json(
                    ApiResponse.error(`Forbidden: Requires permission '${requiredPermission}'`)
                );
                return;
            }

            // Permission granted
            Logger.info('Permission granted', { userId, requiredPermission });
            next();

        } catch (error) {
            Logger.error('Permission check error', error);
            res.status(500).json(ApiResponse.error('Internal server error during permission check'));
        }
    };
}

/**
 * Middleware to check if user has ANY of the specified permissions
 * Usage: requireAnyPermission(['users:read', 'users:write'])
 */
export function requireAnyPermission(permissions: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;

            if (!authReq.user) {
                res.status(401).json(ApiResponse.error('Unauthorized: No user found in request'));
                return;
            }

            const { userId, tenantId } = authReq.user;

            // Get user's roles with permissions
            const userRoles = await prisma.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });

            // Flatten all permissions
            const userPermissions = userRoles.flatMap(ur =>
                ur.role.permissions.map(p => formatPermission(p.resource, p.action))
            );

            const hasPermission = permissions.some(p => userPermissions.includes(p));

            if (!hasPermission) {
                Logger.warn('Permission denied - requires any of', {
                    userId,
                    tenantId,
                    requiredPermissions: permissions,
                    userPermissions
                });

                res.status(403).json(
                    ApiResponse.error(`Forbidden: Requires any of these permissions: ${permissions.join(', ')}`)
                );
                return;
            }

            Logger.info('Permission granted (any)', { userId, matchedPermissions: permissions });
            next();

        } catch (error) {
            Logger.error('Permission check error', error);
            res.status(500).json(ApiResponse.error('Internal server error during permission check'));
        }
    };
}

/**
 * Middleware to check if user has ALL of the specified permissions
 * Usage: requireAllPermissions(['users:read', 'roles:read'])
 */
export function requireAllPermissions(permissions: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;

            if (!authReq.user) {
                res.status(401).json(ApiResponse.error('Unauthorized: No user found in request'));
                return;
            }

            const { userId, tenantId } = authReq.user;

            // Get user's roles with permissions
            const userRoles = await prisma.userRole.findMany({
                where: { userId },
                include: {
                    role: {
                        include: {
                            permissions: true
                        }
                    }
                }
            });

            // Flatten all permissions
            const userPermissions = userRoles.flatMap(ur =>
                ur.role.permissions.map(p => formatPermission(p.resource, p.action))
            );

            const missingPermissions = permissions.filter(p => !userPermissions.includes(p));

            if (missingPermissions.length > 0) {
                Logger.warn('Permission denied - missing permissions', {
                    userId,
                    tenantId,
                    missingPermissions,
                    userPermissions
                });

                res.status(403).json(
                    ApiResponse.error(`Forbidden: Missing permissions: ${missingPermissions.join(', ')}`)
                );
                return;
            }

            Logger.info('Permission granted (all)', { userId, permissions });
            next();

        } catch (error) {
            Logger.error('Permission check error', error);
            res.status(500).json(ApiResponse.error('Internal server error during permission check'));
        }
    };
}

/**
 * Helper to check user permissions without middleware (for use in controllers)
 */
export async function checkUserPermission(
    userId: string,
    resource: string,
    action: string
): Promise<boolean> {
    try {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        const userPermissions = userRoles.flatMap(ur =>
            ur.role.permissions.map(p => formatPermission(p.resource, p.action))
        );

        const requiredPermission = formatPermission(resource, action);
        return userPermissions.includes(requiredPermission);
    } catch (error) {
        Logger.error('checkUserPermission error', error);
        return false;
    }
}
