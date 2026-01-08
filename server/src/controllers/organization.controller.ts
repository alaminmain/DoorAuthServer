import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';
import { AuthenticatedRequest } from '../middlewares/permissionMiddleware';

const organizationService = new OrganizationService();

export class OrganizationController {
    // Get all organizations for tenant
    async getAllOrganizations(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const tenantId = req.query.tenantId as string || authReq.user?.tenantId;

            if (!tenantId) {
                res.status(400).json(ApiResponse.error('Tenant ID is required'));
                return;
            }

            const organizations = await organizationService.getAll(tenantId);
            res.json(ApiResponse.success(organizations));
        } catch (error) {
            Logger.error('Get all organizations error', error);
            res.status(500).json(ApiResponse.error('Failed to fetch organizations'));
        }
    }

    // Get organization by ID
    async getOrganizationById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const organization = await organizationService.getById(id);

            if (!organization) {
                res.status(404).json(ApiResponse.error('Organization not found'));
                return;
            }

            res.json(ApiResponse.success(organization));
        } catch (error) {
            Logger.error('Get organization by ID error', error);
            res.status(500).json(ApiResponse.error('Failed to fetch organization'));
        }
    }

    // Get organization tree
    async getOrganizationTree(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const tree = await organizationService.getTree(id);

            if (!tree) {
                res.status(404).json(ApiResponse.error('Organization not found'));
                return;
            }

            res.json(ApiResponse.success(tree));
        } catch (error) {
            Logger.error('Get organization tree error', error);
            res.status(500).json(ApiResponse.error('Failed to fetch organization tree'));
        }
    }

    // Create organization
    async createOrganization(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const { name, description, parentId } = req.body;
            const tenantId = req.body.tenantId || authReq.user?.tenantId;

            if (!name || !tenantId) {
                res.status(400).json(ApiResponse.error('Name and tenant ID are required'));
                return;
            }

            const organization = await organizationService.create({
                name,
                description,
                tenantId,
                parentId
            });

            res.status(201).json(ApiResponse.success(organization, 'Organization created successfully'));
        } catch (error: any) {
            Logger.error('Create organization error', error);

            if (error.message?.includes('Circular reference')) {
                res.status(400).json(ApiResponse.error(error.message));
                return;
            }

            res.status(500).json(ApiResponse.error('Failed to create organization'));
        }
    }

    // Update organization
    async updateOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, parentId } = req.body;

            const organization = await organizationService.update(id, {
                name,
                description,
                parentId
            });

            res.json(ApiResponse.success(organization, 'Organization updated successfully'));
        } catch (error: any) {
            Logger.error('Update organization error', error);

            if (error.message?.includes('not found')) {
                res.status(404).json(ApiResponse.error(error.message));
                return;
            }

            if (error.message?.includes('Circular reference')) {
                res.status(400).json(ApiResponse.error(error.message));
                return;
            }

            res.status(500).json(ApiResponse.error('Failed to update organization'));
        }
    }

    // Delete organization
    async deleteOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await organizationService.delete(id);

            res.json(ApiResponse.success(null, 'Organization deleted successfully'));
        } catch (error: any) {
            Logger.error('Delete organization error', error);

            if (error.message?.includes('not found')) {
                res.status(404).json(ApiResponse.error(error.message));
                return;
            }

            if (error.message?.includes('sub-organizations') || error.message?.includes('users')) {
                res.status(400).json(ApiResponse.error(error.message));
                return;
            }

            res.status(500).json(ApiResponse.error('Failed to delete organization'));
        }
    }

    // Assign user to organization
    async assignUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json(ApiResponse.error('User ID is required'));
                return;
            }

            const user = await organizationService.assignUser(id, userId);

            res.json(ApiResponse.success(user, 'User assigned to organization successfully'));
        } catch (error) {
            Logger.error('Assign user to organization error', error);
            res.status(500).json(ApiResponse.error('Failed to assign user to organization'));
        }
    }

    // Remove user from organization
    async removeUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const user = await organizationService.removeUser(userId);

            res.json(ApiResponse.success(user, 'User removed from organization successfully'));
        }
        catch (error) {
            Logger.error('Remove user from organization error', error);
            res.status(500).json(ApiResponse.error('Failed to remove user from organization'));
        }
    }

    // Get users by organization
    async getUsersByOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const users = await organizationService.getUsersByOrganization(id);

            res.json(ApiResponse.success(users));
        } catch (error) {
            Logger.error('Get users by organization error', error);
            res.status(500).json(ApiResponse.error('Failed to fetch users'));
        }
    }
}
