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
      const userId = (req as any).user?.userId;

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

      // Revoke all user sessions
      if (userId) {
        const { SessionService } = require('../services/session.service');
        const sessionService = new SessionService();

        try {
          await sessionService.revokeAllUserSessions(userId, 'logout');
        } catch (err) {
          console.error('Error revoking sessions on logout:', err);
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

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json(ApiResponse.error('Refresh token is required'));
      }

      // For now, we'll use the same JWT verification since we don't have separate refresh tokens yet
      // In production, you'd want to store refresh tokens separately and verify them
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

      try {
        // Verify the refresh token (currently same as access token)
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

        // Get user from database
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          return res.status(401).json(ApiResponse.error('User not found'));
        }

        if (!user.isApproved || user.isLocked) {
          return res.status(401).json(ApiResponse.error('Account is not active'));
        }

        // Generate new access token
        const crypto = require('crypto');
        const jti = crypto.randomUUID();

        const newToken = jwt.sign(
          {
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            roles: [],
            jti,
          },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Create new session
        const { SessionService } = require('../services/session.service');
        const sessionService = new SessionService();

        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        let sessionToken: string | null = null;
        try {
          sessionToken = await sessionService.createSession({
            userId: user.id,
            ipAddress,
            userAgent,
            expiresInHours: 0.5, // 30 minutes
          });
        } catch (error: any) {
          console.error('Failed to create session on refresh:', error);
        }

        res.status(200).json(
          ApiResponse.success(
            {
              token: newToken,
              sessionToken,
              user: {
                id: user.id,
                email: user.email,
                userName: user.userName,
                tenantId: user.tenantId,
              },
            },
            'Token refreshed successfully'
          )
        );
      } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json(ApiResponse.error('Refresh token expired'));
        }
        return res.status(401).json(ApiResponse.error('Invalid refresh token'));
      }
    } catch (error: any) {
      res.status(500).json(ApiResponse.error(error.message));
    }
  }
}
