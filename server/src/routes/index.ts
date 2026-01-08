import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import twoFactorRoutes from './twoFactor.routes';
import passwordRecoveryRoutes from './passwordRecovery.routes';
import accountSecurityRoutes from './accountSecurity.routes';
import oauthRoutes from './oauth.routes';
import applicationRoutes from './application.routes';
import roleRoutes from './role.routes';
import menuRoutes from './menu.routes';
import userRoutes from './user.routes';
import permissionRoutes from './permission.routes';
import dashboardRoutes from './dashboard.routes';
import organizationRoutes from './organization.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/password', passwordRecoveryRoutes);
router.use('/account', accountSecurityRoutes);
router.use('/oauth', oauthRoutes);
router.use('/applications', applicationRoutes);
router.use('/roles', roleRoutes);
router.use('/menus', menuRoutes);
router.use('/users', userRoutes);
router.use('/permissions', permissionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/organizations', organizationRoutes);

export default router;
