import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import twoFactorRoutes from './twoFactor.routes';
import passwordRecoveryRoutes from './passwordRecovery.routes';
import accountSecurityRoutes from './accountSecurity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/password', passwordRecoveryRoutes);
router.use('/account', accountSecurityRoutes);

export default router;
