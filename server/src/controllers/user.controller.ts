import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/ApiResponse';
import bcrypt from 'bcrypt';

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

    async resetPassword(req: Request, res: Response) {
        try {
            const { newPassword } = req.body;
            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json(ApiResponse.error('Password must be at least 6 characters'));
            }

            const hash = await bcrypt.hash(newPassword, 10);
            await userService.updatePassword(req.params.id, hash);

            res.status(200).json(ApiResponse.success(null, 'Password reset successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async sendResetLink(req: Request, res: Response) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json(ApiResponse.error('Email is required'));
            }

            // TODO: Implement actual email sending logic
            // For now, just return success
            // In production, you would:
            // 1. Generate a reset token
            // 2. Store it in database with expiry
            // 3. Send email with reset link

            res.status(200).json(ApiResponse.success(null, 'Password reset link sent successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async changeLockStatus(req: Request, res: Response) {
        try {
            const { isLocked } = req.body;
            if (typeof isLocked !== 'boolean') {
                return res.status(400).json(ApiResponse.error('isLocked must be a boolean'));
            }

            const result = await userService.updateLockStatus(req.params.id, isLocked);
            res.status(200).json(ApiResponse.success(result, 'Lock status updated'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async getActivityLogs(req: Request, res: Response) {
        try {
            const result = await userService.getActivityLogs(req.params.id);
            res.status(200).json(ApiResponse.success(result, 'Activity logs retrieved'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async getUserRoles(req: Request, res: Response) {
        try {
            const result = await userService.getUserRoles(req.params.id);
            res.status(200).json(ApiResponse.success(result, 'User roles retrieved'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async assignRole(req: Request, res: Response) {
        try {
            const { roleId } = req.body;
            if (!roleId) {
                return res.status(400).json(ApiResponse.error('roleId is required'));
            }
            await userService.assignRole(req.params.id, roleId);
            res.status(200).json(ApiResponse.success(null, 'Role assigned successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }

    async removeRole(req: Request, res: Response) {
        try {
            await userService.removeRole(req.params.id, req.params.roleId);
            res.status(200).json(ApiResponse.success(null, 'Role removed successfully'));
        } catch (error: any) {
            res.status(500).json(ApiResponse.error(error.message));
        }
    }
}
