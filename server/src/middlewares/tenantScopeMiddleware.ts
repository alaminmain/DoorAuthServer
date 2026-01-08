import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';
import { AuthenticatedRequest } from './permissionMiddleware';

const prisma = new PrismaClient();

/**
 * Middleware to validate that the requested resource belongs to the user's tenant
 * Prevents cross-tenant data access
 * 
 * Usage: validateTenantScope('applicationId', 'application')
 * 
 * @param resourceIdParam - The request parameter name containing the resource ID (e.g., 'id', 'applicationId')
 * @param resourceType - The type of resource ('application', 'role', 'menu', 'user', 'organization')
 */
export function validateTenantScope(
    resourceIdParam: string = 'id',
    resourceType: 'application' | 'role' | 'menu' | 'user' | 'organization'
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authReq = req as AuthenticatedRequest;

            if (!authReq.user) {
                res.status(401).json(ApiResponse.error('Unauthorized: No user found in request'));
                return;
            }

            const { tenantId: userTenantId } = authReq.user;

            // Get resource ID from params, query, or body
            const resourceId = req.params[resourceIdParam] ||
                req.query[resourceIdParam] ||
                req.body[resourceIdParam];

            if (!resourceId) {
                // If no resource ID is provided, skip validation
                // This is common for list operations
                next();
                return;
            }

            let resource: any = null;

            // Query the appropriate table based on resource type
            switch (resourceType) {
                case 'application':
                    resource = await prisma.application.findUnique({
                        where: { id: resourceId as string },
                        select: { tenantId: true }
                    });
                    break;

                case 'role':
                    resource = await prisma.role.findUnique({
                        where: { id: resourceId as string },
                        select: { tenantId: true }
                    });
                    break;

                case 'menu':
                    resource = await prisma.menu.findUnique({
                        where: { id: resourceId as string },
                        include: {
                            application: {
                                select: { tenantId: true }
                            }
                        }
                    });
                    break;

                case 'user':
                    resource = await prisma.user.findUnique({
                        where: { id: resourceId as string },
                        select: { tenantId: true }
                    });
                    break;

                case 'organization':
                    resource = await prisma.organization.findUnique({
                        where: { id: resourceId as string },
                        select: { tenantId: true }
                    });
                    break;

                default:
                    Logger.error('Invalid resource type', { resourceType });
                    res.status(500).json(ApiResponse.error('Internal server error: Invalid resource type'));
                    return;
            }

            if (!resource) {
                res.status(404).json(ApiResponse.error(`${resourceType} not found`));
                return;
            }

            // Extract tenant ID based on resource structure
            const resourceTenantId = resourceType === 'menu'
                ? resource.application.tenantId
                : resource.tenantId;

            // Validate tenant match
            if (resourceTenantId !== userTenantId) {
                Logger.warn('Cross-tenant access attempt', {
                    userId: authReq.user.userId,
                    userTenantId,
                    resourceType,
                    resourceId,
                    resourceTenantId
                });

                res.status(403).json(
                    ApiResponse.error('Forbidden: Access denied to resource from another tenant')
                );
                return;
            }

            // Tenant validation passed
            Logger.info('Tenant scope validated', {
                userId: authReq.user.userId,
                tenantId: userTenantId,
                resourceType,
                resourceId
            });
            next();

        } catch (error) {
            Logger.error('Tenant scope validation error', error);
            res.status(500).json(ApiResponse.error('Internal server error during tenant validation'));
        }
    };
}

/**
 * Middleware to auto-inject tenant ID into request body
 * This prevents users from accidentally or maliciously setting another tenant's ID
 * 
 * Usage: injectTenantId()
 */
export function injectTenantId() {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json(ApiResponse.error('Unauthorized: No user found in request'));
            return;
        }

        const { tenantId } = authReq.user;

        // Inject or override tenant ID in request body
        if (req.body) {
            req.body.tenantId = tenantId;
            Logger.info('Tenant ID injected into request', { tenantId });
        }

        next();
    };
}

/**
 * Middleware to validate query parameter tenantId matches user's tenant
 * Useful for list operations with tenant filtering
 * 
 * Usage: validateQueryTenantId()
 */
export function validateQueryTenantId() {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json(ApiResponse.error('Unauthorized: No user found in request'));
            return;
        }

        const { tenantId: userTenantId } = authReq.user;
        const queryTenantId = req.query.tenantId as string;

        // If no tenantId in query, auto-inject it
        if (!queryTenantId) {
            req.query.tenantId = userTenantId;
            Logger.info('Tenant ID auto-injected to query', { tenantId: userTenantId });
            next();
            return;
        }

        // If tenantId provided, validate it matches user's tenant
        if (queryTenantId !== userTenantId) {
            Logger.warn('Cross-tenant query attempt', {
                userId: authReq.user.userId,
                userTenantId,
                requestedTenantId: queryTenantId
            });

            res.status(403).json(
                ApiResponse.error('Forbidden: Cannot query data from another tenant')
            );
            return;
        }

        next();
    };
}
