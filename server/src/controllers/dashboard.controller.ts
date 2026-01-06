import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';

const prisma = new PrismaClient();

export class DashboardController {
    /**
     * Get dashboard stats
     */
    async getStats(req: Request, res: Response) {
        try {
            const { tenantId } = req.query; // Optional filter by tenant

            const whereTenant = tenantId ? { tenantId: tenantId as string } : undefined;
            const whereTenantForUser = tenantId ? { tenantId: tenantId as string } : undefined;
            // Roles often are tenant specific too
            const whereTenantForRole = tenantId ? { tenantId: tenantId as string } : undefined;

            // Run queries in parallel for performance
            const [
                totalTenants,
                totalApplications,
                totalUsers,
                totalRoles,
                recentActivity
            ] = await Promise.all([
                prisma.tenant.count(),
                prisma.application.count({ where: whereTenant }),
                prisma.user.count({ where: whereTenantForUser }),
                prisma.role.count({ where: whereTenantForRole }),
                prisma.auditLog.findMany({
                    where: tenantId ? { tenantId: tenantId as string } : undefined,
                    take: 10,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        user: {
                            select: {
                                userName: true,
                                email: true
                            }
                        },
                        tenant: {
                            select: {
                                name: true
                            }
                        }
                    }
                })
            ]);

            const stats = {
                totalTenants,
                totalApplications,
                totalUsers,
                totalRoles,
                recentActivity: recentActivity.map(log => ({
                    id: log.id,
                    action: log.action,
                    resource: log.resource,
                    details: log.details,
                    timestamp: log.createdAt,
                    userName: log.user.userName || log.user.email,
                    tenantName: log.tenant.name
                }))
            };

            res.status(200).json(ApiResponse.success(stats));
        } catch (error: any) {
            console.error('Dashboard stats error:', error);
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
