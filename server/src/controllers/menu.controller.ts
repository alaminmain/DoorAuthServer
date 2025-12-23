import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class MenuController {
    /**
     * Get all menus (with hierarchy)
     */
    async getAllMenus(req: Request, res: Response) {
        try {
            const { applicationId } = req.query;

            const menus = await prisma.menu.findMany({
                where: applicationId ? { applicationId: applicationId as string } : undefined,
                include: {
                    application: {
                        select: {
                            name: true,
                        },
                    },
                    parent: {
                        select: {
                            id: true,
                            label: true,
                        },
                    },
                },
                orderBy: [
                    { order: 'asc' },
                    { label: 'asc' },
                ],
            });

            // Build hierarchy
            const hierarchy = this.buildMenuHierarchy(menus);

            res.status(200).json(ApiResponse.success(hierarchy));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get menu by ID
     */
    async getMenuById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const menu = await prisma.menu.findUnique({
                where: { id },
                include: {
                    application: true,
                    parent: true,
                    children: true,
                },
            });

            if (!menu) {
                res.status(404).json(ApiResponse.error('Menu not found'));
                return;
            }

            res.status(200).json(ApiResponse.success(menu));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Create new menu item
     */
    async createMenu(req: Request, res: Response) {
        try {
            const { label, path, icon, order, parentId, applicationId, requiredPermission } = req.body;

            if (!label || !applicationId) {
                res.status(400).json(ApiResponse.error('Label and applicationId are required'));
                return;
            }

            // Verify application exists
            const application = await prisma.application.findUnique({
                where: { id: applicationId },
            });

            if (!application) {
                res.status(404).json(ApiResponse.error('Application not found'));
                return;
            }

            // Verify parent exists if provided
            if (parentId) {
                const parent = await prisma.menu.findUnique({
                    where: { id: parentId },
                });

                if (!parent) {
                    res.status(404).json(ApiResponse.error('Parent menu not found'));
                    return;
                }
            }

            const menu = await prisma.menu.create({
                data: {
                    label,
                    path,
                    icon,
                    order: order || 0,
                    parentId,
                    applicationId,
                    requiredPermission,
                },
            });

            Logger.info('Menu created', { menuId: menu.id, label, applicationId });

            res.status(201).json(ApiResponse.success(menu, 'Menu created successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Update menu item
     */
    async updateMenu(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { label, path, icon, order, parentId, requiredPermission } = req.body;

            const menu = await prisma.menu.findUnique({
                where: { id },
            });

            if (!menu) {
                res.status(404).json(ApiResponse.error('Menu not found'));
                return;
            }

            // Prevent circular reference
            if (parentId === id) {
                res.status(400).json(ApiResponse.error('Menu cannot be its own parent'));
                return;
            }

            const updated = await prisma.menu.update({
                where: { id },
                data: {
                    ...(label && { label }),
                    ...(path !== undefined && { path }),
                    ...(icon !== undefined && { icon }),
                    ...(order !== undefined && { order }),
                    ...(parentId !== undefined && { parentId }),
                    ...(requiredPermission !== undefined && { requiredPermission }),
                },
            });

            Logger.info('Menu updated', { menuId: id });

            res.status(200).json(ApiResponse.success(updated, 'Menu updated successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Delete menu item
     */
    async deleteMenu(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const menu = await prisma.menu.findUnique({
                where: { id },
                include: {
                    children: true,
                },
            });

            if (!menu) {
                res.status(404).json(ApiResponse.error('Menu not found'));
                return;
            }

            if (menu.children.length > 0) {
                res.status(400).json(ApiResponse.error('Cannot delete menu with children. Delete children first.'));
                return;
            }

            await prisma.menu.delete({
                where: { id },
            });

            Logger.info('Menu deleted', { menuId: id });

            res.status(200).json(ApiResponse.success({}, 'Menu deleted successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Get Smart Menu for current user (filtered by permissions)
     */
    async getSmartMenu(req: Request, res: Response) {
        try {
            const user = (req as any).user;
            const { applicationId } = req.query;

            if (!applicationId) {
                res.status(400).json(ApiResponse.error('applicationId is required'));
                return;
            }

            // Get user with roles and permissions
            const userRecord = await prisma.user.findUnique({
                where: { id: user.userId },
                include: {
                    roles: {
                        include: {
                            role: {
                                include: {
                                    permissions: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!userRecord) {
                res.status(404).json(ApiResponse.error('User not found'));
                return;
            }

            // Get all user permissions
            const userPermissions = userRecord.roles.flatMap(ur =>
                ur.role.permissions.map(p => `${p.resource}:${p.action}`)
            );

            // Get all menus for the application
            const allMenus = await prisma.menu.findMany({
                where: { applicationId: applicationId as string },
                orderBy: [
                    { order: 'asc' },
                    { label: 'asc' },
                ],
            });

            // Filter menus based on permissions
            const filteredMenus = allMenus.filter(menu => {
                if (!menu.requiredPermission) return true; // No permission required
                return userPermissions.includes(menu.requiredPermission);
            });

            // Build hierarchy
            const hierarchy = this.buildMenuHierarchy(filteredMenus);

            Logger.info('Smart menu retrieved', { userId: user.userId, applicationId, menuCount: filteredMenus.length });

            res.status(200).json(ApiResponse.success(hierarchy));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    /**
     * Build menu hierarchy from flat list
     */
    private buildMenuHierarchy(menus: any[]): any[] {
        const menuMap = new Map();
        const rootMenus: any[] = [];

        // Create map of all menus
        menus.forEach(menu => {
            menuMap.set(menu.id, { ...menu, children: [] });
        });

        // Build hierarchy
        menus.forEach(menu => {
            const menuNode = menuMap.get(menu.id);
            if (menu.parentId) {
                const parent = menuMap.get(menu.parentId);
                if (parent) {
                    parent.children.push(menuNode);
                }
            } else {
                rootMenus.push(menuNode);
            }
        });

        return rootMenus;
    }
}
