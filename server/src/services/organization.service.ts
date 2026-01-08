import { PrismaClient, Organization } from '@prisma/client';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class OrganizationService {
    /**
     * Get all organizations for a tenant
     */
    async getAll(tenantId: string) {
        return prisma.organization.findMany({
            where: { tenantId },
            include: {
                parent: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        children: true,
                        users: true
                    }
                }
            },
            orderBy: [
                { level: 'asc' },
                { name: 'asc' }
            ]
        });
    }

    /**
     * Get organization by ID
     */
    async getById(id: string) {
        return prisma.organization.findUnique({
            where: { id },
            include: {
                parent: true,
                children: {
                    include: {
                        _count: {
                            select: {
                                children: true,
                                users: true
                            }
                        }
                    }
                },
                users: {
                    select: {
                        id: true,
                        userName: true,
                        email: true,
                        designation: true
                    }
                }
            }
        });
    }

    /**
     * Get organization tree from a specific node (including all descendants)
     */
    async getTree(id: string): Promise<any> {
        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                children: true,
                users: {
                    select: {
                        id: true,
                        userName: true,
                        email: true,
                        designation: true
                    }
                }
            }
        });

        if (!organization) {
            return null;
        }

        // Recursively build tree
        const children = await Promise.all(
            organization.children.map(child => this.getTree(child.id))
        );

        return {
            ...organization,
            children
        };
    }

    /**
     * Create a new organization
     */
    async create(data: {
        name: string;
        description?: string;
        tenantId: string;
        parentId?: string;
    }) {
        // Calculate level based on parent
        let level = 0;
        if (data.parentId) {
            const parent = await prisma.organization.findUnique({
                where: { id: data.parentId }
            });
            if (parent) {
                level = parent.level + 1;
            }
        }

        // Validate no circular reference
        if (data.parentId) {
            const isCircular = await this.checkCircularReference(data.parentId, data.tenantId);
            if (isCircular) {
                throw new Error('Circular reference detected in organization hierarchy');
            }
        }

        Logger.info('Creating organization', { name: data.name, tenantId: data.tenantId });

        return prisma.organization.create({
            data: {
                name: data.name,
                description: data.description,
                level,
                tenantId: data.tenantId,
                parentId: data.parentId || null
            },
            include: {
                parent: true,
                _count: {
                    select: {
                        children: true,
                        users: true
                    }
                }
            }
        });
    }

    /**
     * Update organization
     */
    async update(id: string, data: {
        name?: string;
        description?: string;
        parentId?: string;
    }) {
        const organization = await prisma.organization.findUnique({
            where: { id }
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        // If changing parent, validate no circular reference and update level
        let updateData: any = {
            name: data.name,
            description: data.description
        };

        if (data.parentId !== undefined) {
            if (data.parentId) {
                // Validate no circular reference
                const isCircular = await this.checkCircularReference(
                    data.parentId,
                    organization.tenantId,
                    id
                );
                if (isCircular) {
                    throw new Error('Circular reference detected in organization hierarchy');
                }

                const parent = await prisma.organization.findUnique({
                    where: { id: data.parentId }
                });
                if (parent) {
                    updateData.level = parent.level + 1;
                    updateData.parentId = data.parentId;
                }
            } else {
                // Moving to root level
                updateData.level = 0;
                updateData.parentId = null;
            }
        }

        Logger.info('Updating organization', { id, updateData });

        return prisma.organization.update({
            where: { id },
            data: updateData,
            include: {
                parent: true,
                _count: {
                    select: {
                        children: true,
                        users: true
                    }
                }
            }
        });
    }

    /**
     * Delete organization (must have no children or users)
     */
    async delete(id: string) {
        const organization = await prisma.organization.findUnique({
            where: { id },
            include: {
                children: true,
                users: true
            }
        });

        if (!organization) {
            throw new Error('Organization not found');
        }

        if (organization.children.length > 0) {
            throw new Error('Cannot delete organization with sub-organizations');
        }

        if (organization.users.length > 0) {
            throw new Error('Cannot delete organization with assigned users');
        }

        Logger.warn('Deleting organization', id);

        return prisma.organization.delete({
            where: { id }
        });
    }

    /**
     * Assign user to organization
     */
    async assignUser(organizationId: string, userId: string) {
        Logger.info('Assigning user to organization', { organizationId, userId });

        return prisma.user.update({
            where: { id: userId },
            data: { organizationId }
        });
    }

    /**
     * Remove user from organization
     */
    async removeUser(userId: string) {
        Logger.info('Removing user from organization', { userId });

        return prisma.user.update({
            where: { id: userId },
            data: { organizationId: null }
        });
    }

    /**
     * Get users by organization
     */
    async getUsersByOrganization(organizationId: string) {
        return prisma.user.findMany({
            where: { organizationId },
            select: {
                id: true,
                userName: true,
                email: true,
                designation: true,
                companyName: true,
                isApproved: true,
                isLocked: true,
                createdAt: true
            }
        });
    }

    /**
     * Check for circular reference in organization hierarchy
     */
    private async checkCircularReference(
        parentId: string,
        tenantId: string,
        excludeId?: string
    ): Promise<boolean> {
        const visited = new Set<string>();
        let currentId: string | null = parentId;

        while (currentId) {
            if (currentId === excludeId) {
                return true; // Circular reference detected
            }

            if (visited.has(currentId)) {
                return true; // Circular reference detected
            }

            visited.add(currentId);

            const org = await prisma.organization.findUnique({
                where: { id: currentId },
                select: { parentId: true }
            });

            if (!org) {
                break;
            }

            currentId = org.parentId;
        }

        return false;
    }
}
