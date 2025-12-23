import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class ApplicationController {
    /**
     * Get all applications
     */
    async getAllApplications(req: Request, res: Response) {
        try {
            const { tenantId } = req.query;

            const applications = await prisma.application.findMany({
                where: tenantId ? { tenantId: tenantId as string } : undefined,
                select: {
                    id: true,
                    name: true,
                    clientId: true,
                    redirectUris: true,
                    tenantId: true,
                    createdAt: true,
                    tenant: {
                        select: {
                            name: true,
                            domain: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            res.status(200).json(ApiResponse.success(applications));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get application by ID
     */
    async getApplicationById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const application = await prisma.application.findUnique({
                where: { id },
                include: {
                    tenant: {
                        select: {
                            name: true,
                            domain: true,
                        },
                    },
                },
            });

            if (!application) {
                res.status(404).json(ApiResponse.error('Application not found'));
                return;
            }

            res.status(200).json(ApiResponse.success(application));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Create new application
     */
    async createApplication(req: Request, res: Response) {
        try {
            const { name, redirectUris, tenantId } = req.body;

            if (!name || !redirectUris || !tenantId) {
                res.status(400).json(ApiResponse.error('Name, redirectUris, and tenantId are required'));
                return;
            }

            // Verify tenant exists
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            if (!tenant) {
                res.status(404).json(ApiResponse.error('Tenant not found'));
                return;
            }

            // Generate client credentials
            const clientId = `${name.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomBytes(8).toString('hex')}`;
            const clientSecret = crypto.randomBytes(32).toString('hex');

            const application = await prisma.application.create({
                data: {
                    name,
                    clientId,
                    clientSecret,
                    redirectUris,
                    tenantId,
                },
            });

            Logger.info('Application created', { applicationId: application.id, name, tenantId });

            res.status(201).json(
                ApiResponse.success(
                    {
                        ...application,
                        clientSecret, // Only shown once during creation
                    },
                    'Application created successfully. Save the client secret - it will not be shown again.'
                )
            );
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Update application
     */
    async updateApplication(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, redirectUris } = req.body;

            const application = await prisma.application.findUnique({
                where: { id },
            });

            if (!application) {
                res.status(404).json(ApiResponse.error('Application not found'));
                return;
            }

            const updated = await prisma.application.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(redirectUris && { redirectUris }),
                },
                select: {
                    id: true,
                    name: true,
                    clientId: true,
                    redirectUris: true,
                    tenantId: true,
                    createdAt: true,
                },
            });

            Logger.info('Application updated', { applicationId: id });

            res.status(200).json(ApiResponse.success(updated, 'Application updated successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Regenerate client secret
     */
    async regenerateSecret(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const application = await prisma.application.findUnique({
                where: { id },
            });

            if (!application) {
                res.status(404).json(ApiResponse.error('Application not found'));
                return;
            }

            const newSecret = crypto.randomBytes(32).toString('hex');

            await prisma.application.update({
                where: { id },
                data: {
                    clientSecret: newSecret,
                },
            });

            Logger.warn('Client secret regenerated', { applicationId: id });

            res.status(200).json(
                ApiResponse.success(
                    { clientSecret: newSecret },
                    'Client secret regenerated successfully. Save it - it will not be shown again.'
                )
            );
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Delete application
     */
    async deleteApplication(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const application = await prisma.application.findUnique({
                where: { id },
            });

            if (!application) {
                res.status(404).json(ApiResponse.error('Application not found'));
                return;
            }

            await prisma.application.delete({
                where: { id },
            });

            Logger.info('Application deleted', { applicationId: id });

            res.status(200).json(ApiResponse.success({}, 'Application deleted successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
