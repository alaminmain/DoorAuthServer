import { Router } from 'express';
import { TwoFactorController } from '../controllers/twoFactor.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const twoFactorController = new TwoFactorController();

/**
 * @swagger
 * /api/2fa/generate:
 *   post:
 *     summary: Generate 2FA secret and QR code
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA secret generated successfully
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
 *                     secret:
 *                       type: string
 *                       example: JBSWY3DPEHPK3PXP
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded QR code image
 *                     otpauthUrl:
 *                       type: string
 *                       example: otpauth://totp/DoorAuthServer%20(user@demo.localhost)?secret=JBSWY3DPEHPK3PXP&issuer=DoorAuthServer
 *                 message:
 *                   type: string
 *                   example: 2FA secret generated. Scan the QR code with your authenticator app.
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/generate', authMiddleware, twoFactorController.generateSecret.bind(twoFactorController));

/**
 * @swagger
 * /api/2fa/verify:
 *   post:
 *     summary: Verify 2FA token and enable 2FA
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
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
 *                       example: 2FA enabled successfully
 *       400:
 *         description: Invalid token or token required
 *       401:
 *         description: Unauthorized
 */
router.post('/verify', authMiddleware, twoFactorController.verifyAndEnable.bind(twoFactorController));

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     summary: Disable 2FA for the authenticated user
 *     tags: [Two-Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: Valid 6-digit code from authenticator app
 *     responses:
 *       200:
 *         description: 2FA disabled successfully
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
 *                       example: 2FA disabled successfully
 *       400:
 *         description: Invalid token
 *       401:
 *         description: Unauthorized
 */
router.post('/disable', authMiddleware, twoFactorController.disable.bind(twoFactorController));

export default router;
