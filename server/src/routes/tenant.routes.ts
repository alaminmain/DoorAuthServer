import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';

const router = Router();
const tenantController = new TenantController();

router.get('/', tenantController.getAllTenants.bind(tenantController));

export default router;
