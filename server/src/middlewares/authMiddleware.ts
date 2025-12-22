import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement JWT verification logic
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json(ApiResponse.error('Unauthorized: No token provided'));
    return;
  }

  // Mock verification
  next();
};
