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
            // Get tenantId from authenticated user
            const userTenantId = (req as any).user?.tenantId;

            if (!userTenantId) {
                res.status(401).json(ApiResponse.error('Unauthorized: No tenant information'));
                return;
            }

            const roles = await prisma.role.findMany({
                where: { tenantId: userTenantId }, // Always filter by user's tenant
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
            const { name, description, tenantId, permissionIds } = req.body;

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

            const data: any = {
                name,
                description,
                tenantId,
            };

            if (req.body.applicationId) {
                data.applicationId = req.body.applicationId;
            }


            const permissionInputs: any[] = [];
            if (permissionIds && Array.isArray(permissionIds)) {
                permissionIds.forEach((pid: string) => {
                    const [resource, action] = pid.split(':');
                    if (resource && action) {
                        permissionInputs.push({ resource, action });
                    }
                });
            }

            if (permissionInputs.length > 0) {
                data.permissions = {
                    create: permissionInputs,
                };
            }

            const role = await prisma.role.create({
                data,
                include: {
                    permissions: true
                }
            });

            Logger.info('Role created', { roleId: role.id, name, tenantId, permissionsCount: permissionIds?.length || 0 });

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
            const { name, description, permissionIds } = req.body;

            const role = await prisma.role.findUnique({
                where: { id },
            });

            if (!role) {
                res.status(404).json(ApiResponse.error('Role not found'));
                return;
            }

            // Use transaction to ensure atomic update
            const updated = await prisma.$transaction(async (tx) => {
                // First, update basic role info
                const basicUpdate: any = {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(req.body.applicationId !== undefined && { applicationId: req.body.applicationId }),
                };

                await tx.role.update({
                    where: { id },
                    data: basicUpdate,
                });

                // Then handle permissions separately if provided
                if (permissionIds && Array.isArray(permissionIds)) {
                    // Delete all existing permissions for this role
                    await tx.permission.deleteMany({
                        where: { roleId: id },
                    });

                    // Parse and deduplicate permissions
                    const permissionSet = new Set<string>();
                    const permissionInputs: any[] = [];

                    permissionIds.forEach((pid: string) => {
                        const [resource, action] = pid.split(':');
                        if (resource && action) {
                            const key = `${resource}:${action}`;
                            if (!permissionSet.has(key)) {
                                permissionSet.add(key);
                                permissionInputs.push({
                                    resource,
                                    action,
                                    roleId: id,
                                });
                            }
                        }
                    });

                    // Create new permissions individually (SQLite doesn't support createMany)
                    for (const permInput of permissionInputs) {
                        try {
                            await tx.permission.create({
                                data: permInput,
                            });
                        } catch (createError: any) {
                            // If it's a unique constraint error, log and continue
                            if (createError.code === 'P2002') {
                                Logger.warn('Duplicate permission skipped', {
                                    roleId: id,
                                    resource: permInput.resource,
                                    action: permInput.action
                                });
                            } else {
                                throw createError;
                            }
                        }
                    }
                }

                // Return the updated role with permissions
                return await tx.role.findUnique({
                    where: { id },
                    include: {
                        permissions: true,
                    },
                });
            });

            Logger.info('Role updated', { roleId: id, permissionsCount: updated?.permissions?.length || 0 });

            res.status(200).json(ApiResponse.success(updated, 'Role updated successfully'));
        } catch (error: any) {
            const { id } = req.params;
            Logger.error('Error updating role', { error: error.message, roleId: id });
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
     * Bulk create roles
     */
    async bulkCreateRoles(req: Request, res: Response) {
        try {
            const { tenantId, roles } = req.body;

            if (!tenantId || !Array.isArray(roles)) {
                res.status(400).json(ApiResponse.error('tenantId and roles array are required'));
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

            const result = await prisma.$transaction(async (tx) => {
                const results = [];
                for (const item of roles) {
                    const { name, description, applicationId, permissionIds } = item;

                    const data: any = {
                        name,
                        description,
                        tenantId,
                        applicationId // Optional
                    };

                    if (permissionIds && Array.isArray(permissionIds)) {
                        const permissionInputs = permissionIds.map((pid: string) => {
                            const [resource, action] = pid.split(':');
                            if (resource && action) return { resource, action };
                            return null;
                        }).filter((p: any) => p !== null);

                        if (permissionInputs.length > 0) {
                            data.permissions = {
                                create: permissionInputs
                            };
                        }
                    }

                    const role = await tx.role.create({
                        data,
                        include: { permissions: true }
                    });
                    results.push(role);
                }
                return results;
            });

            Logger.info('Bulk roles created', { count: result.length, tenantId });

            res.status(201).json(ApiResponse.success(result, 'Roles created successfully'));
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
