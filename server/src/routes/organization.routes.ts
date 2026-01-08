import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';
import { validateTenantScope, validateQueryTenantId, injectTenantId } from '../middlewares/tenantScopeMiddleware';

const router = Router();
const organizationController = new OrganizationController();

/**
 * @swagger
 * /api/organizations:
 *   get:
 *     summary: Get all organizations for tenant
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *         description: Filter by tenant ID (auto-injected if not provided)
 *     responses:
 *       200:
 *         description: List of organizations
 *       403:
 *         description: Insufficient permissions
 */
router.get(
    '/',
    authMiddleware,
    requirePermission('organizations', 'read'),
    validateQueryTenantId(),
    organizationController.getAllOrganizations.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     tags: [Organizations]
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
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get(
    '/:id',
    authMiddleware,
    requirePermission('organizations', 'read'),
    validateTenantScope('id', 'organization'),
    organizationController.getOrganizationById.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/{id}/tree:
 *   get:
 *     summary: Get organization tree from node
 *     tags: [Organizations]
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
 *         description: Organization tree with all descendants
 *       404:
 *         description: Organization not found
 */
router.get(
    '/:id/tree',
    authMiddleware,
    requirePermission('organizations', 'read'),
    validateTenantScope('id', 'organization'),
    organizationController.getOrganizationTree.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations:
 *   post:
 *     summary: Create new organization
 *     tags: [Organizations]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engineering Department
 *               description:
 *                 type: string
 *                 example: Main engineering division
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       400:
 *         description: Invalid input or circular reference
 */
router.post(
    '/',
    authMiddleware,
    requirePermission('organizations', 'write'),
    injectTenantId(),
    organizationController.createOrganization.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/{id}:
 *   put:
 *     summary: Update organization
 *     tags: [Organizations]
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
 *               description:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       400:
 *         description: Invalid input or circular reference  
 *       404:
 *         description: Organization not found
 */
router.put(
    '/:id',
    authMiddleware,
    requirePermission('organizations', 'write'),
    validateTenantScope('id', 'organization'),
    organizationController.updateOrganization.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/{id}:
 *   delete:
 *     summary: Delete organization
 *     tags: [Organizations]
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
 *         description: Organization deleted successfully
 *       400:
 *         description: Cannot delete organization with sub-organizations or users
 *       404:
 *         description: Organization not found
 */
router.delete(
    '/:id',
    authMiddleware,
    requirePermission('organizations', 'write'),
    validateTenantScope('id', 'organization'),
    organizationController.deleteOrganization.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/{id}/users:
 *   get:
 *     summary: Get users in organization
 *     tags: [Organizations]
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
 *         description: List of users in organization
 */
router.get(
    '/:id/users',
    authMiddleware,
    requirePermission('organizations', 'read'),
    validateTenantScope('id', 'organization'),
    organizationController.getUsersByOrganization.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/{id}/users:
 *   post:
 *     summary: Assign user to organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User assigned successfully
 */
router.post(
    '/:id/users',
    authMiddleware,
    requirePermission('organizations', 'write'),
    validateTenantScope('id', 'organization'),
    organizationController.assignUser.bind(organizationController)
);

/**
 * @swagger
 * /api/organizations/users/{userId}:
 *   delete:
 *     summary: Remove user from organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from organization successfully
 */
router.delete(
    '/users/:userId',
    authMiddleware,
    requirePermission('organizations', 'write'),
    validateTenantScope('userId', 'user'),
    organizationController.removeUser.bind(organizationController)
);

export default router;
