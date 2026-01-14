import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const sessionController = new SessionController();

// All session routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/sessions/my
 * @desc    Get current user's active sessions
 * @access  Private
 */
router.get('/my', (req, res) => sessionController.getMySessions(req, res));

/**
 * @route   GET /api/sessions/stats
 * @desc    Get session statistics
 * @access  Private (Admin)
 */
router.get('/stats', (req, res) => sessionController.getSessionStats(req, res));

/**
 * @route   GET /api/sessions
 * @desc    Get sessions for a specific user (admin)
 * @access  Private (Admin)
 */
router.get('/', (req, res) => sessionController.getAllSessions(req, res));

/**
 * @route   DELETE /api/sessions/my/all
 * @desc    Revoke all current user's sessions
 * @access  Private
 */
router.delete('/my/all', (req, res) =>
    sessionController.revokeAllMySessions(req, res)
);

/**
 * @route   DELETE /api/sessions/:sessionToken
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/:sessionToken', (req, res) =>
    sessionController.revokeSession(req, res)
);

/**
 * @route   DELETE /api/sessions/user/:userId/all
 * @desc    Admin: Revoke all sessions for a specific user
 * @access  Private (Admin)
 */
router.delete('/user/:userId/all', (req, res) =>
    sessionController.revokeAllUserSessions(req, res)
);

export default router;
