import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const oauthController = new OAuthController();

/**
 * @swagger
 * /oauth/authorize:
 *   get:
 *     summary: OAuth 2.0 Authorization Endpoint
 *     tags: [OAuth/OIDC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: response_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [code]
 *         description: Must be "code" for authorization code flow
 *       - in: query
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Application client ID
 *         example: admin-panel-client-id
 *       - in: query
 *         name: redirect_uri
 *         required: true
 *         schema:
 *           type: string
 *         description: Registered redirect URI
 *         example: http://localhost:5173/callback
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *         description: Requested scopes (space-separated)
 *         example: openid profile email
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Opaque value to maintain state
 *       - in: query
 *         name: code_challenge
 *         schema:
 *           type: string
 *         description: PKCE code challenge
 *       - in: query
 *         name: code_challenge_method
 *         schema:
 *           type: string
 *           enum: [S256, plain]
 *         description: PKCE code challenge method
 *     responses:
 *       200:
 *         description: Authorization code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     redirect_url:
 *                       type: string
 *                     code:
 *                       type: string
 *                     expires_in:
 *                       type: integer
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: User not authenticated
 */
router.get('/authorize', authMiddleware, oauthController.authorize.bind(oauthController));

/**
 * @swagger
 * /oauth/token:
 *   post:
 *     summary: OAuth 2.0 Token Endpoint
 *     tags: [OAuth/OIDC]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grant_type
 *               - client_id
 *               - client_secret
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [authorization_code, refresh_token]
 *                 example: authorization_code
 *               code:
 *                 type: string
 *                 description: Authorization code (required for authorization_code grant)
 *               redirect_uri:
 *                 type: string
 *                 description: Must match the redirect_uri from /authorize
 *               client_id:
 *                 type: string
 *                 example: admin-panel-client-id
 *               client_secret:
 *                 type: string
 *                 example: super-secret-key-change-me
 *               refresh_token:
 *                 type: string
 *                 description: Refresh token (required for refresh_token grant)
 *               code_verifier:
 *                 type: string
 *                 description: PKCE code verifier
 *     responses:
 *       200:
 *         description: Tokens issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 token_type:
 *                   type: string
 *                   example: Bearer
 *                 expires_in:
 *                   type: integer
 *                   example: 3600
 *                 refresh_token:
 *                   type: string
 *                 scope:
 *                   type: string
 *       400:
 *         description: Invalid request
 */
router.post('/token', oauthController.token.bind(oauthController));

/**
 * @swagger
 * /oauth/userinfo:
 *   get:
 *     summary: OIDC UserInfo Endpoint
 *     tags: [OAuth/OIDC]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sub:
 *                   type: string
 *                   description: Subject identifier (user ID)
 *                 email:
 *                   type: string
 *                 email_verified:
 *                   type: boolean
 *                 name:
 *                   type: string
 *                 preferred_username:
 *                   type: string
 *                 tenant_id:
 *                   type: string
 *                 company:
 *                   type: string
 *                 job_title:
 *                   type: string
 *                 phone_number:
 *                   type: string
 *                 updated_at:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/userinfo', authMiddleware, oauthController.userinfo.bind(oauthController));

/**
 * @swagger
 * /oauth/revoke:
 *   post:
 *     summary: Revoke Token Endpoint
 *     tags: [OAuth/OIDC]
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
 *                 description: Token to revoke
 *               token_type_hint:
 *                 type: string
 *                 enum: [refresh_token]
 *                 description: Type of token being revoked
 *     responses:
 *       200:
 *         description: Token revoked successfully
 *       400:
 *         description: Invalid request
 */
router.post('/revoke', oauthController.revoke.bind(oauthController));

export default router;
