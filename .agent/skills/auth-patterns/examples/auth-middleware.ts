/**
 * Authentication Middleware Example
 * Express middleware for JWT-based authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface JWTPayload {
  sub: string;
  tenantId: number;
  roles: string[];
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: number;
    }
  }
}

/**
 * Extract JWT from HttpOnly cookie or Authorization header
 */
function extractToken(req: Request): string | null {
  // Prefer cookie (more secure)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(token: string): Promise<boolean> {
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const blacklisted = await prisma.tokenBlacklist.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gt: new Date() }
    }
  });

  return !!blacklisted;
}

/**
 * Main authentication middleware
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_TOKEN'
    });
    return;
  }

  try {
    // Check blacklist
    if (await isTokenBlacklisted(token)) {
      res.status(401).json({
        success: false,
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload;

    // Attach user to request
    req.user = decoded;
    req.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload;

    req.user = decoded;
    req.tenantId = decoded.tenantId;
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

/**
 * Tenant scope middleware - ensures all queries are tenant-scoped
 */
export function tenantScope(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.tenantId) {
    res.status(400).json({
      success: false,
      error: 'Tenant context required'
    });
    return;
  }

  next();
}
