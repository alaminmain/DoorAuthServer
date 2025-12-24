import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const permissionController = new PermissionController();

// Use authMiddleware to protect these routes
router.use(authMiddleware);

router.get('/', (req, res) => permissionController.getAllPermissions(req, res));

export default router;
