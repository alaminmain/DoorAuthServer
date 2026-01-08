import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/ApiResponse';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.register(req.body, ipAddress, userAgent);
      res.status(201).json(ApiResponse.success(result, result.message || 'User registered successfully'));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  }

  async login(req: Request, res: Response) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(req.body, ipAddress, userAgent);

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
      // Get the token from the request
      const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;

      // If token exists, blacklist it
      if (token) {
        const jwt = require('jsonwebtoken');
        const { TokenBlacklistService } = require('../services/tokenBlacklist.service');
        const tokenBlacklistService = new TokenBlacklistService();

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;

          // Blacklist the token if it has a JTI
          if (decoded.jti) {
            await tokenBlacklistService.blacklistToken({
              jti: decoded.jti,
              userId: decoded.userId,
              tokenType: 'access',
              expiresAt: new Date(decoded.exp * 1000), // Convert exp to Date
              reason: 'logout',
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            });
          }
        } catch (err) {
          // Token might be invalid or expired, but we still want to clear cookies
          console.error('Error blacklisting token on logout:', err);
        }
      }

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
