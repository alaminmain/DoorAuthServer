import { Router } from 'express';
import { AccountSecurityController } from '../controllers/accountSecurity.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const accountSecurityController = new AccountSecurityController();

/**
 * @swagger
 * /api/account/status:
 *   get:
 *     summary: Get account security status
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     isLocked:
 *                       type: boolean
 *                       example: false
 *                     isApproved:
 *                       type: boolean
 *                       example: true
 *                     passAttemptCount:
 *                       type: integer
 *                       example: 0
 *                     lastLoginTime:
 *                       type: string
 *                       format: date-time
 *                     isTwoFactorEnabled:
 *                       type: boolean
 *                       example: false
 *                     remainingAttempts:
 *                       type: integer
 *                       example: 5
 *                     maxAttempts:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/status', authMiddleware, accountSecurityController.getAccountStatus.bind(accountSecurityController));

/**
 * @swagger
 * /api/account/unlock:
 *   post:
 *     summary: Unlock a locked user account (Admin)
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 example: user-id-to-unlock
 *     responses:
 *       200:
 *         description: Account unlocked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Account unlocked successfully
 *       400:
 *         description: userId is required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/unlock', authMiddleware, accountSecurityController.unlockAccount.bind(accountSecurityController));

/**
 * @swagger
 * /api/account/reset-attempts:
 *   post:
 *     summary: Reset failed login attempts (Admin)
 *     tags: [Account Security]
 *     security:
 *       - bearerAuth: []
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
 *                 format: uuid
 *                 example: user-id-to-reset
 *     responses:
 *       200:
 *         description: Login attempts reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Login attempts reset successfully
 *       400:
 *         description: userId is required
 *       401:
 *         description: Unauthorized
 */
router.post('/reset-attempts', authMiddleware, accountSecurityController.resetAttempts.bind(accountSecurityController));

export default router;
