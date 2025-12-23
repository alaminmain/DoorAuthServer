import { Router } from 'express';
import { TwoFactorController } from '../controllers/twoFactor.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const twoFactorController = new TwoFactorController();

// All 2FA routes require authentication
router.post('/generate', authMiddleware, twoFactorController.generateSecret.bind(twoFactorController));
router.post('/verify', authMiddleware, twoFactorController.verifyAndEnable.bind(twoFactorController));
router.post('/disable', authMiddleware, twoFactorController.disable.bind(twoFactorController));

export default router;
