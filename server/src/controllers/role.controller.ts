import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class RoleController {
    /**
     * Get all roles
     */
    async getAllRoles(req: Request, res: Response) {
        try {
            const { tenantId } = req.query;

            const roles = await prisma.role.findMany({
                where: tenantId ? { tenantId: tenantId as string } : undefined,
                include: {
                    tenant: {
                        select: {
                            name: true,
                        },
                    },
                    permissions: {
                        select: {
                            id: true,
                            resource: true,
                            action: true,
                        },
                    },
                    _count: {
                        select: {
                            users: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            res.status(200).json(ApiResponse.success(roles));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get role by ID
     */
    async getRoleById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const role = await prisma.role.findUnique({
                where: { id },
                include: {
                    tenant: {
                        select: {
                            name: true,
                        },
                    },
                    permissions: true,
                    users: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    email: true,
                                    userName: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!role) {
                res.status(404).json(ApiResponse.error('Role not found'));
                return;
            }

            res.status(200).json(ApiResponse.success(role));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Create new role
     */
    async createRole(req: Request, res: Response) {
        try {
            const { name, description, tenantId } = req.body;

            if (!name || !tenantId) {
                res.status(400).json(ApiResponse.error('Name and tenantId are required'));
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

            const role = await prisma.role.create({
                data: {
                    name,
                    description,
                    tenantId,
                },
            });

            Logger.info('Role created', { roleId: role.id, name, tenantId });

            res.status(201).json(ApiResponse.success(role, 'Role created successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Update role
     */
    async updateRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const role = await prisma.role.findUnique({
                where: { id },
            });

            if (!role) {
                res.status(404).json(ApiResponse.error('Role not found'));
                return;
            }

            const updated = await prisma.role.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                },
            });

            Logger.info('Role updated', { roleId: id });

            res.status(200).json(ApiResponse.success(updated, 'Role updated successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Delete role
     */
    async deleteRole(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const role = await prisma.role.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: {
                            users: true,
                        },
                    },
                },
            });

            if (!role) {
                res.status(404).json(ApiResponse.error('Role not found'));
                return;
            }

            if (role._count.users > 0) {
                res.status(400).json(ApiResponse.error('Cannot delete role with assigned users'));
                return;
            }

            await prisma.role.delete({
                where: { id },
            });

            Logger.info('Role deleted', { roleId: id });

            res.status(200).json(ApiResponse.success({}, 'Role deleted successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Add permission to role
     */
    async addPermission(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { resource, action } = req.body;

            if (!resource || !action) {
                res.status(400).json(ApiResponse.error('Resource and action are required'));
                return;
            }

            const role = await prisma.role.findUnique({
                where: { id },
            });

            if (!role) {
                res.status(404).json(ApiResponse.error('Role not found'));
                return;
            }

            const permission = await prisma.permission.create({
                data: {
                    resource,
                    action,
                    roleId: id,
                },
            });

            Logger.info('Permission added to role', { roleId: id, resource, action });

            res.status(201).json(ApiResponse.success(permission, 'Permission added successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Remove permission from role
     */
    async removePermission(req: Request, res: Response) {
        try {
            const { id, permissionId } = req.params;

            const permission = await prisma.permission.findUnique({
                where: { id: permissionId },
            });

            if (!permission || permission.roleId !== id) {
                res.status(404).json(ApiResponse.error('Permission not found for this role'));
                return;
            }

            await prisma.permission.delete({
                where: { id: permissionId },
            });

            Logger.info('Permission removed from role', { roleId: id, permissionId });

            res.status(200).json(ApiResponse.success({}, 'Permission removed successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
