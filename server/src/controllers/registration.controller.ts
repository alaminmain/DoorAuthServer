/**
 * Registration Controller
 * Handles HTTP endpoints for the three-tier registration workflow
 */

import { Request, Response } from 'express';
import { RegistrationService } from '../services/registration.service';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const registrationService = new RegistrationService();

export class RegistrationController {
    /**
     * POST /api/registration/request
     * Public endpoint - Create a new registration request
     */
    async createRequest(req: Request, res: Response) {
        try {
            const { email, password, fullName, companyName, contact } = req.body;

            // Validation
            if (!email || !password || !fullName) {
                return res.status(400).json(
                    ApiResponse.error('Email, password, and full name are required')
                );
            }

            // Password validation
            if (password.length < 8) {
                return res.status(400).json(
                    ApiResponse.error('Password must be at least 8 characters')
                );
            }

            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];

            const result = await registrationService.createRegistrationRequest(
                { email, password, fullName, companyName, contact },
                { ipAddress, userAgent }
            );

            Logger.info('Registration request created via API', { email, requestId: result.requestId });

            res.status(201).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Registration request creation failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * POST /api/registration/verify-email
     * Public endpoint - Verify email with token
     */
    async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json(
                    ApiResponse.error('Verification token is required')
                );
            }

            const result = await registrationService.verifyRegistrationEmail(token);

            Logger.info('Registration email verified via API', { email: result.email });

            res.status(200).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Email verification failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * POST /api/registration/resend-verification
     * Public endpoint - Resend verification email
     */
    async resendVerification(req: Request, res: Response) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json(
                    ApiResponse.error('Email is required')
                );
            }

            const result = await registrationService.resendVerificationEmail(email);

            Logger.info('Verification email resent via API', { email });

            res.status(200).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Resend verification failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * GET /api/registration/status/:requestId
     * Public endpoint - Check registration status
     */
    async getStatus(req: Request, res: Response) {
        try {
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json(
                    ApiResponse.error('Request ID is required')
                );
            }

            const result = await registrationService.getRegistrationStatus(requestId);

            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            Logger.error('Get registration status failed', { error: error.message });
            res.status(404).json(ApiResponse.error(error.message));
        }
    }

    /**
     * GET /api/registration/requests
     * Admin endpoint - Get pending registration requests
     * Required permission: registration:view_requests
     */
    async getPendingRequests(req: Request, res: Response) {
        try {
            const { status, emailVerified, page, limit } = req.query;

            const result = await registrationService.getPendingRequests({
                status: status as string,
                emailVerified: emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined,
                page: page ? parseInt(page as string) : undefined,
                limit: limit ? parseInt(limit as string) : undefined,
            });

            Logger.info('Fetched pending requests via API', {
                count: result.requests.length,
                total: result.pagination.total,
            });

            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            Logger.error('Get pending requests failed', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * POST /api/registration/requests/:id/assign-tenant
     * Admin endpoint - Assign tenant to registration request
     * Required permission: registration:assign_tenant
     */
    async assignTenant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { tenantId, organizationId } = req.body;
            const adminUserId = (req as any).user?.userId;

            if (!id) {
                return res.status(400).json(
                    ApiResponse.error('Request ID is required')
                );
            }

            if (!tenantId) {
                return res.status(400).json(
                    ApiResponse.error('Tenant ID is required')
                );
            }

            if (!adminUserId) {
                return res.status(401).json(
                    ApiResponse.error('Admin user not authenticated')
                );
            }

            const result = await registrationService.assignTenantToRequest(
                id,
                adminUserId,
                { tenantId, organizationId }
            );

            Logger.info('Tenant assigned to registration via API', {
                requestId: id,
                tenantId,
                userId: result.userId,
            });

            res.status(200).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Assign tenant failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * POST /api/registration/requests/:id/reject
     * Admin endpoint - Reject registration request
     * Required permission: registration:reject_request
     */
    async rejectRequest(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const adminUserId = (req as any).user?.userId;

            if (!id) {
                return res.status(400).json(
                    ApiResponse.error('Request ID is required')
                );
            }

            if (!reason) {
                return res.status(400).json(
                    ApiResponse.error('Rejection reason is required')
                );
            }

            if (!adminUserId) {
                return res.status(401).json(
                    ApiResponse.error('Admin user not authenticated')
                );
            }

            const result = await registrationService.rejectRegistrationRequest(
                id,
                adminUserId,
                reason
            );

            Logger.info('Registration request rejected via API', { requestId: id, reason });

            res.status(200).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Reject request failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * GET /api/registration/pending-users
     * Tenant Admin endpoint - Get users pending approval in tenant
     * Required permission: user:view_pending
     */
    async getPendingUsers(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user?.tenantId;

            if (!tenantId) {
                return res.status(401).json(
                    ApiResponse.error('User tenant not found')
                );
            }

            const result = await registrationService.getPendingUsersForTenant(tenantId);

            Logger.info('Fetched pending users via API', {
                tenantId,
                count: result.users.length,
            });

            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            Logger.error('Get pending users failed', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * POST /api/registration/users/:id/approve
     * Tenant Admin endpoint - Approve user and assign roles
     * Required permission: user:approve, user:assign_roles
     */
    async approveUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { roleIds, organizationId } = req.body;
            const tenantAdminId = (req as any).user?.userId;

            if (!id) {
                return res.status(400).json(
                    ApiResponse.error('User ID is required')
                );
            }

            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
                return res.status(400).json(
                    ApiResponse.error('At least one role ID is required')
                );
            }

            if (!tenantAdminId) {
                return res.status(401).json(
                    ApiResponse.error('Tenant admin not authenticated')
                );
            }

            const result = await registrationService.approveUserAndAssignRoles(
                id,
                tenantAdminId,
                { roleIds, organizationId }
            );

            Logger.info('User approved via API', {
                userId: id,
                roles: result.roles.map(r => r.name),
            });

            res.status(200).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Approve user failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * POST /api/registration/users/:id/reject
     * Tenant Admin endpoint - Reject user in tenant
     * Required permission: user:reject
     */
    async rejectUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const tenantAdminId = (req as any).user?.userId;

            if (!id) {
                return res.status(400).json(
                    ApiResponse.error('User ID is required')
                );
            }

            if (!reason) {
                return res.status(400).json(
                    ApiResponse.error('Rejection reason is required')
                );
            }

            if (!tenantAdminId) {
                return res.status(401).json(
                    ApiResponse.error('Tenant admin not authenticated')
                );
            }

            // Get user to find their registration request
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const user = await prisma.user.findUnique({
                where: { id },
                select: { registrationRequestId: true, tenantId: true },
            });

            if (!user) {
                return res.status(404).json(ApiResponse.error('User not found'));
            }

            // Verify tenant admin is in the same tenant
            const tenantAdmin = await prisma.user.findUnique({
                where: { id: tenantAdminId },
                select: { tenantId: true },
            });

            if (!tenantAdmin || tenantAdmin.tenantId !== user.tenantId) {
                return res.status(403).json(
                    ApiResponse.error('You can only reject users in your own tenant')
                );
            }

            if (!user.registrationRequestId) {
                return res.status(400).json(
                    ApiResponse.error('No registration request found for this user')
                );
            }

            const result = await registrationService.rejectRegistrationRequest(
                user.registrationRequestId,
                tenantAdminId,
                reason
            );

            Logger.info('User rejected via API', { userId: id, reason });

            res.status(200).json(ApiResponse.success(result, result.message));
        } catch (error: any) {
            Logger.error('Reject user failed', { error: error.message });
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    /**
     * GET /api/registration/tenants
     * Admin endpoint - Get available tenants for assignment
     * Required permission: registration:assign_tenant
     */
    async getAvailableTenants(req: Request, res: Response) {
        try {
            const result = await registrationService.getAvailableTenants();

            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            Logger.error('Get available tenants failed', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * GET /api/registration/tenants/:tenantId/organizations
     * Admin endpoint - Get organizations for a tenant
     * Required permission: registration:assign_tenant
     */
    async getOrganizationsForTenant(req: Request, res: Response) {
        try {
            const { tenantId } = req.params;

            if (!tenantId) {
                return res.status(400).json(
                    ApiResponse.error('Tenant ID is required')
                );
            }

            const result = await registrationService.getOrganizationsForTenant(tenantId);

            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            Logger.error('Get organizations for tenant failed', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * GET /api/registration/roles
     * Tenant Admin endpoint - Get available roles for role assignment
     * Required permission: user:assign_roles
     */
    async getAvailableRoles(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user?.tenantId;

            if (!tenantId) {
                return res.status(401).json(
                    ApiResponse.error('User tenant not found')
                );
            }

            const result = await registrationService.getAvailableRolesForTenant(tenantId);

            res.status(200).json(ApiResponse.success(result));
        } catch (error: any) {
            Logger.error('Get available roles failed', { error: error.message });
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
