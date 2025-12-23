import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../utils/ApiResponse';

const prisma = new PrismaClient();

export class TenantController {
    async getAllTenants(req: Request, res: Response) {
        try {
            const tenants = await prisma.tenant.findMany({
                select: {
                    id: true,
                    name: true,
                    domain: true,
                    createdAt: true,
                },
            });
            res.status(200).json(ApiResponse.success(tenants, 'Tenants retrieved successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
