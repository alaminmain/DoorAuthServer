import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { EmailVerificationController } from '../controllers/emailVerification.controller';
import { authLimiter, registerLimiter } from '../middlewares/rateLimiter';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const authController = new AuthController();
const emailVerificationController = new EmailVerificationController();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@demo.localhost
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               userName:
 *                 type: string
 *                 example: John Doe
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 example: be32cd76-8926-4267-bc98-f8670cc281c2
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many registration attempts
 */
router.post('/register', registerLimiter, authController.register.bind(authController));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - tenantId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@demo.localhost
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               tenantId:
 *                 type: string
 *                 format: uuid
 *                 example: be32cd76-8926-4267-bc98-f8670cc281c2
 *               twoFactorToken:
 *                 type: string
 *                 example: "123456"
 *                 description: Required if 2FA is enabled
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *                     requires2FA:
 *                       type: boolean
 *                       description: True if 2FA token is required
 *                 message:
 *                   type: string
 *                   example: Login successful
 *       401:
 *         description: Invalid credentials or account locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', authLimiter, authController.login.bind(authController));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and clear session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 */
router.post('/logout', authController.logout.bind(authController));

export default router;

// Email Verification Routes
router.post('/verify-email', emailVerificationController.verifyEmail.bind(emailVerificationController));
router.get('/verify-email/:token', emailVerificationController.verifyEmailViaLink.bind(emailVerificationController));
router.post('/resend-verification', authMiddleware, emailVerificationController.resendVerification.bind(emailVerificationController));
router.get('/verification-status', authMiddleware, emailVerificationController.getVerificationStatus.bind(emailVerificationController));

