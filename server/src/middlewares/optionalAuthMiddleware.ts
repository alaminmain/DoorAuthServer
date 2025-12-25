import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;

    if (!token) {
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        (req as any).user = decoded;
    } catch (error) {
        // Ignore invalid tokens in optional auth
        console.warn('Optional auth: Invalid token ignored');
    }
    next();
};
