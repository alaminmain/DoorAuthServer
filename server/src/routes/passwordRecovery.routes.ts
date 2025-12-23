import { Router } from 'express';
import { PasswordRecoveryController } from '../controllers/passwordRecovery.controller';

const router = Router();
const passwordRecoveryController = new PasswordRecoveryController();

/**
 * @swagger
 * /api/password/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Password Recovery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@demo.localhost
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 example: be32cd76-8926-4267-bc98-f8670cc281c2
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
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
 *                     message:
 *                       type: string
 *                       example: If the email exists, a password reset link has been sent.
 *       400:
 *         description: Email and tenantId are required
 *       500:
 *         description: Failed to send email
 */
router.post('/forgot-password', passwordRecoveryController.forgotPassword.bind(passwordRecoveryController));

/**
 * @swagger
 * /api/password/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Password Recovery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *                 description: Reset token from email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123!
 *                 description: Must be at least 8 characters
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                     message:
 *                       type: string
 *                       example: Password reset successful. You can now login with your new password.
 *       400:
 *         description: Invalid or expired token, or password too short
 */
router.post('/reset-password', passwordRecoveryController.resetPassword.bind(passwordRecoveryController));

/**
 * @swagger
 * /api/password/validate-token:
 *   get:
 *     summary: Validate password reset token
 *     tags: [Password Recovery]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset token to validate
 *         example: abc123def456...
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.get('/validate-token', passwordRecoveryController.validateToken.bind(passwordRecoveryController));

export default router;
