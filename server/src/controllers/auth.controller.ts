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

      // Set HttpOnly cookie for SSO/OAuth
      // Set HttpOnly cookie for SSO/OAuth
      res.cookie('access_token', result.token, {
        httpOnly: true,
        secure: true, // Always secure for HTTPS
        sameSite: 'none', // Allow cross-site usage
        path: '/', // Explicit path
        maxAge: 3600000 // 1 hour
      });

      res.status(200).json(ApiResponse.success(result, 'Login successful'));
    } catch (error: any) {
      res.status(401).json(ApiResponse.error(error.message));
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // Clear the access_token cookie
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });

      // Clear the jwt cookie (used by OAuth)
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });

      res.status(200).json(ApiResponse.success({}, 'Logout successful'));
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }
}
