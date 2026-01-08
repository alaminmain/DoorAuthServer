import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/ApiResponse';
import { TokenBlacklistService } from '../services/tokenBlacklist.service';

const tokenBlacklistService = new TokenBlacklistService();

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;

  if (!token) {
    res.status(401).json(ApiResponse.error('Unauthorized: No token provided'));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;

    // Check if token is blacklisted (if JTI exists)
    if (decoded.jti) {
      const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        res.status(401).json(ApiResponse.error('Unauthorized: Token has been revoked'));
        return;
      }
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json(ApiResponse.error('Unauthorized: Invalid token'));
  }
};
