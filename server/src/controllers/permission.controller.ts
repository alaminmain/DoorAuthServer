import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { SYSTEM_PERMISSIONS } from '../config/permissions';

export class PermissionController {
    /**
     * Get all available system permissions
     */
    async getAllPermissions(req: Request, res: Response) {
        try {
            // Map to the format expected by the frontend (with an ID)
            const permissions = SYSTEM_PERMISSIONS.map(p => ({
                id: `${p.resource}:${p.action}`,
                resource: p.resource,
                action: p.action,
                description: p.description
            }));

            res.status(200).json(ApiResponse.success(permissions));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
