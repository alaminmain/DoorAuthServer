/**
 * Registration Routes
 * Routes for the three-tier registration workflow
 */

import { Router } from 'express';
import { RegistrationController } from '../controllers/registration.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const registrationController = new RegistrationController();

// Rate limiter for registration endpoint (3 requests per 15 minutes per IP)
const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for verification email resend (3 requests per 5 minutes per IP)
const verificationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 requests per window
    message: {
        success: false,
        message: 'Too many verification requests. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

/**
 * @swagger
 * /api/registration/request:
 *   post:
 *     summary: Create a new registration request
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               fullName:
 *                 type: string
 *               companyName:
 *                 type: string
 *               contact:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration request created successfully
 *       400:
 *         description: Validation error or email already exists
 */
router.post(
    '/request',
    registrationLimiter,
    registrationController.createRequest.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Registration]
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
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
    '/verify-email',
    registrationController.verifyEmail.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email not found or already verified
 */
router.post(
    '/resend-verification',
    verificationLimiter,
    registrationController.resendVerification.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/status/{requestId}:
 *   get:
 *     summary: Check registration status
 *     tags: [Registration]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration status retrieved
 *       404:
 *         description: Registration request not found
 */
router.get(
    '/status/:requestId',
    registrationController.getStatus.bind(registrationController)
);

// =====================================================
// ADMIN ROUTES (System Admin only)
// =====================================================

/**
 * @swagger
 * /api/registration/requests:
 *   get:
 *     summary: Get pending registration requests (Admin only)
 *     tags: [Registration Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, EMAIL_VERIFIED, TENANT_ASSIGNED, COMPLETED, REJECTED, EXPIRED]
 *       - in: query
 *         name: emailVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of registration requests
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
    '/requests',
    authMiddleware,
    requirePermission('registration', 'view_requests'),
    registrationController.getPendingRequests.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/requests/{id}/assign-tenant:
 *   post:
 *     summary: Assign tenant to registration request (Admin only)
 *     tags: [Registration Admin]
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
 *               - tenantId
 *             properties:
 *               tenantId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant assigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
    '/requests/:id/assign-tenant',
    authMiddleware,
    requirePermission('registration', 'assign_tenant'),
    registrationController.assignTenant.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/requests/{id}/reject:
 *   post:
 *     summary: Reject registration request (Admin only)
 *     tags: [Registration Admin]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
    '/requests/:id/reject',
    authMiddleware,
    requirePermission('registration', 'reject_request'),
    registrationController.rejectRequest.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/tenants:
 *   get:
 *     summary: Get available tenants for assignment (Admin only)
 *     tags: [Registration Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available tenants
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
    '/tenants',
    authMiddleware,
    requirePermission('registration', 'assign_tenant'),
    registrationController.getAvailableTenants.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/tenants/{tenantId}/organizations:
 *   get:
 *     summary: Get organizations for a tenant (Admin only)
 *     tags: [Registration Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of organizations
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
    '/tenants/:tenantId/organizations',
    authMiddleware,
    requirePermission('registration', 'assign_tenant'),
    registrationController.getOrganizationsForTenant.bind(registrationController)
);

// =====================================================
// TENANT ADMIN ROUTES
// =====================================================

/**
 * @swagger
 * /api/registration/pending-users:
 *   get:
 *     summary: Get users pending approval in tenant (Tenant Admin only)
 *     tags: [Registration Tenant Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
    '/pending-users',
    authMiddleware,
    requirePermission('user', 'view_pending'),
    registrationController.getPendingUsers.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/users/{id}/approve:
 *   post:
 *     summary: Approve user and assign roles (Tenant Admin only)
 *     tags: [Registration Tenant Admin]
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
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User approved successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
    '/users/:id/approve',
    authMiddleware,
    requirePermission('user', 'approve'),
    registrationController.approveUser.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/users/{id}/reject:
 *   post:
 *     summary: Reject user in tenant (Tenant Admin only)
 *     tags: [Registration Tenant Admin]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User rejected successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post(
    '/users/:id/reject',
    authMiddleware,
    requirePermission('user', 'reject'),
    registrationController.rejectUser.bind(registrationController)
);

/**
 * @swagger
 * /api/registration/roles:
 *   get:
 *     summary: Get available roles for role assignment (Tenant Admin only)
 *     tags: [Registration Tenant Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available roles
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.get(
    '/roles',
    authMiddleware,
    requirePermission('user', 'assign_roles'),
    registrationController.getAvailableRoles.bind(registrationController)
);

export default router;
