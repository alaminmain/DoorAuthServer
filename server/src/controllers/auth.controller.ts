import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(ApiResponse.success(result, 'User registered successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(ApiResponse.success(result, 'Login successful'));
    } catch (error: any) {
      res.status(401).json(ApiResponse.error(error.message));
    }
  }
}
