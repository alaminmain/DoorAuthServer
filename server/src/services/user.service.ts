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

    async delete(id: string) {
        Logger.warn('Deleting user', id);
        return prisma.user.delete({
            where: { id },
        });
    }
}
