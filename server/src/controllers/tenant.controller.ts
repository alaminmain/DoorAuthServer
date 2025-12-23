import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class TenantController {
    /**
     * Get all tenants
     */
    async getAllTenants(req: Request, res: Response) {
        try {
            const tenants = await prisma.tenant.findMany({
                select: {
                    id: true,
                    name: true,
                    domain: true,
                    brandingConfig: true,
                    createdAt: true,
                    _count: {
                        select: {
                            users: true,
                            applications: true,
                            roles: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            res.status(200).json(ApiResponse.success(tenants, 'Tenants retrieved successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get tenant by ID
     */
    async getTenantById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const tenant = await prisma.tenant.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            users: true,
                            applications: true,
                            roles: true,
                        },
                    },
                },
            });

            if (!tenant) {
                res.status(404).json(ApiResponse.error('Tenant not found'));
                return;
            }

            res.status(200).json(ApiResponse.success(tenant));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Create new tenant
     */
    async createTenant(req: Request, res: Response) {
        try {
            const { name, domain, brandingConfig } = req.body;

            if (!name || !domain) {
                res.status(400).json(ApiResponse.error('Name and domain are required'));
                return;
            }

            // Check if domain already exists
            const existing = await prisma.tenant.findUnique({
                where: { domain },
            });

            if (existing) {
                res.status(400).json(ApiResponse.error('Domain already exists'));
                return;
            }

            const tenant = await prisma.tenant.create({
                data: {
                    name,
                    domain,
                    brandingConfig: brandingConfig ? JSON.stringify(brandingConfig) : null,
                },
            });

            Logger.info('Tenant created', { tenantId: tenant.id, name, domain });

            res.status(201).json(ApiResponse.success(tenant, 'Tenant created successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Update tenant
     */
    async updateTenant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, domain, brandingConfig } = req.body;

            const tenant = await prisma.tenant.findUnique({
                where: { id },
            });

            if (!tenant) {
                res.status(404).json(ApiResponse.error('Tenant not found'));
                return;
            }

            // Check if new domain conflicts with existing
            if (domain && domain !== tenant.domain) {
                const existing = await prisma.tenant.findUnique({
                    where: { domain },
                });

                if (existing) {
                    res.status(400).json(ApiResponse.error('Domain already exists'));
                    return;
                }
            }

            const updated = await prisma.tenant.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(domain && { domain }),
                    ...(brandingConfig && { brandingConfig: JSON.stringify(brandingConfig) }),
                },
            });

            Logger.info('Tenant updated', { tenantId: id });

            res.status(200).json(ApiResponse.success(updated, 'Tenant updated successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Delete tenant
     */
    async deleteTenant(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const tenant = await prisma.tenant.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            users: true,
                            applications: true,
                        },
                    },
                },
            });

            if (!tenant) {
                res.status(404).json(ApiResponse.error('Tenant not found'));
                return;
            }

            // Prevent deletion if tenant has users or applications
            if (tenant._count.users > 0 || tenant._count.applications > 0) {
                res.status(400).json(
                    ApiResponse.error('Cannot delete tenant with existing users or applications')
                );
                return;
            }

            await prisma.tenant.delete({
                where: { id },
            });

            Logger.info('Tenant deleted', { tenantId: id });

            res.status(200).json(ApiResponse.success({}, 'Tenant deleted successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
