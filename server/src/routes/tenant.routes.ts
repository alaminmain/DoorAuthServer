import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const tenantController = new TenantController();

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: List of all tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       domain:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get('/', tenantController.getAllTenants.bind(tenantController));

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant details
 *       404:
 *         description: Tenant not found
 */
router.get('/:id', tenantController.getTenantById.bind(tenantController));

/**
 * @swagger
 * /api/tenants:
 *   post:
 *     summary: Create new tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - domain
 *             properties:
 *               name:
 *                 type: string
 *                 example: Acme Corporation
 *               domain:
 *                 type: string
 *                 example: acme.localhost
 *               brandingConfig:
 *                 type: object
 *                 description: Custom branding configuration
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Invalid input or domain already exists
 */
router.post('/', authMiddleware, tenantController.createTenant.bind(tenantController));

/**
 * @swagger
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               brandingConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 */
router.put('/:id', authMiddleware, tenantController.updateTenant.bind(tenantController));

/**
 * @swagger
 * /api/tenants/{id}:
 *   delete:
 *     summary: Delete tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       400:
 *         description: Cannot delete tenant with existing data
 *       404:
 *         description: Tenant not found
 */
router.delete('/:id', authMiddleware, tenantController.deleteTenant.bind(tenantController));

export default router;
