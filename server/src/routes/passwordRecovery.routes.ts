import { Router } from 'express';
import { PasswordRecoveryController } from '../controllers/passwordRecovery.controller';

const router = Router();
const passwordRecoveryController = new PasswordRecoveryController();

router.post('/forgot-password', passwordRecoveryController.forgotPassword.bind(passwordRecoveryController));
router.post('/reset-password', passwordRecoveryController.resetPassword.bind(passwordRecoveryController));
router.get('/validate-token', passwordRecoveryController.validateToken.bind(passwordRecoveryController));

export default router;
