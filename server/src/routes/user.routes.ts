import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/users/bulk:
 *   post:
 *     summary: Bulk create users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - users
 *             properties:
 *               tenantId:
 *                 type: string
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - email
 *                     - userName
 *                     - password
 *                   properties:
 *                     email: { type: string }
 *                     userName: { type: string }
 *                     password: { type: string }
 *                     designation: { type: string }
 *     responses:
 *       201:
 *         description: Users created successfully
 */
router.post('/bulk', authMiddleware, userController.bulkCreateUsers.bind(userController));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authMiddleware, userController.getAll.bind(userController));

/**
 * @swagger
 * /api/users/me/applications:
 *   get:
 *     summary: Get currently logged in user's applications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/me/applications', authMiddleware, userController.getMyApplications.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', authMiddleware, userController.getById.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
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
 *             properties:
 *               userName:
 *                 type: string
 *               email:
 *                 type: string
 *               companyName:
 *                 type: string
 *               designation:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', authMiddleware, userController.update.bind(userController));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
router.delete('/:id', authMiddleware, userController.delete.bind(userController));


/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     summary: Reset user password (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/:id/reset-password', authMiddleware, userController.resetPassword.bind(userController));

/**
 * @swagger
 * /api/users/{id}/send-reset-link:
 *   post:
 *     summary: Send password reset link to user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset link sent successfully
 */
router.post('/:id/send-reset-link', authMiddleware, userController.sendResetLink.bind(userController));

/**
 * @swagger
 * /api/users/{id}/lock-status:
 *   put:
 *     summary: Change user lock status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isLocked:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Lock status updated
 */
router.put('/:id/lock-status', authMiddleware, userController.changeLockStatus.bind(userController));

/**
 * @swagger
 * /api/users/{id}/activity-logs:
 *   get:
 *     summary: Get user latest activity logs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of activity logs
 */
router.get('/:id/activity-logs', authMiddleware, userController.getActivityLogs.bind(userController));

/**
 * @swagger
 * /api/users/{id}/roles:
 *   get:
 *     summary: Get user roles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: List of user roles
 */
router.get('/:id/roles', authMiddleware, userController.getUserRoles.bind(userController));

/**
 * @swagger
 * /api/users/{id}/roles:
 *   post:
 *     summary: Assign role to user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned successfully
 */
router.post('/:id/roles', authMiddleware, userController.assignRole.bind(userController));

/**
 * @swagger
 * /api/users/{id}/roles/{roleId}:
 *   delete:
 *     summary: Remove role from user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: path
 *         name: roleId
 *         required: true
 *     responses:
 *       200:
 *         description: Role removed successfully
 */
router.delete('/:id/roles/:roleId', authMiddleware, userController.removeRole.bind(userController));

export default router;
