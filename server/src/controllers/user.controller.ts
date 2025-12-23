import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';

const userService = new UserService();

export class UserController {
    async getAll(req: Request, res: Response) {
        try {
            const tenantId = req.query.tenantId as string;
            const result = await userService.getAll(tenantId);
            res.status(200).json(ApiResponse.success(result, 'Users retrieved successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const result = await userService.getById(req.params.id);
            if (!result) {
                return res.status(404).json(ApiResponse.error('User not found'));
            }
            res.status(200).json(ApiResponse.success(result, 'User retrieved successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async update(req: Request, res: Response) {
        try {
            const result = await userService.update(req.params.id, req.body);
            res.status(200).json(ApiResponse.success(result, 'User updated successfully'));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }

    async delete(req: Request, res: Response) {
        try {
            await userService.delete(req.params.id);
            res.status(200).json(ApiResponse.success(null, 'User deleted successfully'));
        } catch (error: any) {
            res.status(400).json(ApiResponse.error(error.message));
        }
    }
}
