import { PrismaClient, User } from '@prisma/client';
import { Logger } from '../utils/Logger';

const prisma = new PrismaClient();

export class UserService {
    async getAll(tenantId?: string) {
        const where = tenantId ? { tenantId } : {};
        return prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                tenantId: true,
                loginId: true,
                userName: true,
                email: true,
                companyName: true,
                companyAddress: true,
                designation: true,
                contact: true,
                isApproved: true,
                isLocked: true,
                isTwoFactorEnabled: true,
                lastLoginTime: true,
                createdAt: true,
                updatedAt: true,
            }
        });
    }

    async getById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    async update(id: string, data: Partial<User>) {
        Logger.info('Updating user', id);
        return prisma.user.update({
            where: { id },
            data,
        });
    }

    async updatePassword(id: string, passwordHash: string) {
        Logger.info('Updating user password', id);
        return prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
    }

    async updateLockStatus(id: string, isLocked: boolean) {
        Logger.info('Updating user lock status', { userId: id, isLocked });
        return prisma.user.update({
            where: { id },
            data: { isLocked },
        });
    }

    async getActivityLogs(id: string) {
        return prisma.auditLog.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }

    async delete(id: string) {
        Logger.warn('Deleting user', id);
        return prisma.user.delete({
            where: { id },
        });
    }

    async getUserRoles(userId: string) {
        const userRoles = await prisma.userRole.findMany({
            where: { userId },
            include: {
                role: true
            }
        });
        return userRoles.map(ur => ur.role);
    }

    async assignRole(userId: string, roleId: string) {
        Logger.info('Assigning role to user', { userId, roleId });
        return prisma.userRole.create({
            data: {
                userId,
                roleId
            }
        });
    }

    async removeRole(userId: string, roleId: string) {
        Logger.info('Removing role from user', { userId, roleId });
        return prisma.userRole.delete({
            where: {
                userId_roleId: {
                    userId,
                    roleId
                }
            }
        });
    }
}
