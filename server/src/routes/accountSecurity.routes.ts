import { Router } from 'express';
import { AccountSecurityController } from '../controllers/accountSecurity.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const accountSecurityController = new AccountSecurityController();

// Get current user's account status (requires authentication)
router.get('/status', authMiddleware, accountSecurityController.getAccountStatus.bind(accountSecurityController));

// Admin endpoints (TODO: Add admin role check middleware)
router.post('/unlock', authMiddleware, accountSecurityController.unlockAccount.bind(accountSecurityController));
router.post('/reset-attempts', authMiddleware, accountSecurityController.resetAttempts.bind(accountSecurityController));

export default router;
