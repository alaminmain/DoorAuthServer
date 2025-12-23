import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const applicationController = new ApplicationController();

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/', authMiddleware, applicationController.getAllApplications.bind(applicationController));

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get application by ID
 *     tags: [Applications]
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
 *         description: Application details
 *       404:
 *         description: Application not found
 */
router.get('/:id', authMiddleware, applicationController.getApplicationById.bind(applicationController));

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create new application
 *     tags: [Applications]
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
 *               - redirectUris
 *               - tenantId
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin Panel
 *               redirectUris:
 *                 type: string
 *                 example: http://localhost:5173/callback,http://localhost:5173/silent-renew
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Application created (includes client_secret - save it!)
 */
router.post('/', authMiddleware, applicationController.createApplication.bind(applicationController));

/**
 * @swagger
 * /api/applications/{id}:
 *   put:
 *     summary: Update application
 *     tags: [Applications]
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
 *               redirectUris:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application updated
 */
router.put('/:id', authMiddleware, applicationController.updateApplication.bind(applicationController));

/**
 * @swagger
 * /api/applications/{id}/regenerate-secret:
 *   post:
 *     summary: Regenerate client secret
 *     tags: [Applications]
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
 *         description: New client secret (save it!)
 */
router.post('/:id/regenerate-secret', authMiddleware, applicationController.regenerateSecret.bind(applicationController));

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     summary: Delete application
 *     tags: [Applications]
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
 *         description: Application deleted
 */
router.delete('/:id', authMiddleware, applicationController.deleteApplication.bind(applicationController));

export default router;
