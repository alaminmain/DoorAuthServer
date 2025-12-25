import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const menuController = new MenuController();

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Get all menus with hierarchy
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         schema:
 *           type: string
 *         description: Filter by application ID
 *     responses:
 *       200:
 *         description: Hierarchical menu structure
 */
router.get('/', authMiddleware, menuController.getAllMenus.bind(menuController));

/**
 * @swagger
 * /api/menus/smart:
 *   get:
 *     summary: Get Smart Menu (filtered by user permissions)
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Permission-filtered menu hierarchy
 */
router.get('/smart', authMiddleware, menuController.getSmartMenu.bind(menuController));

/**
 * @swagger
 * /api/menus/{id}:
 *   get:
 *     summary: Get menu by ID
 *     tags: [Menus]
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
 *         description: Menu details
 */
router.get('/:id', authMiddleware, menuController.getMenuById.bind(menuController));

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Create new menu item
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - applicationId
 *             properties:
 *               label:
 *                 type: string
 *                 example: Dashboard
 *               path:
 *                 type: string
 *                 example: /dashboard
 *               icon:
 *                 type: string
 *                 example: dashboard
 *               order:
 *                 type: integer
 *                 example: 0
 *               parentId:
 *                 type: string
 *                 description: Parent menu ID for nested menus
 *               applicationId:
 *                 type: string
 *                 format: uuid
 *               requiredPermission:
 *                 type: string
 *                 example: dashboard:view
 *     responses:
 *       201:
 *         description: Menu created successfully
 */
router.post('/', authMiddleware, menuController.createMenu.bind(menuController));

/**
 * @swagger
 * /api/menus/bulk:
 *   post:
 *     summary: Bulk create menu items
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicationId
 *               - menus
 *             properties:
 *               applicationId:
 *                 type: string
 *               menus:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - label
 *                   properties:
 *                     label: { type: string }
 *                     path: { type: string }
 *                     icon: { type: string }
 *                     order: { type: integer }
 *                     parentId: { type: string }
 *                     requiredPermission: { type: string }
 *     responses:
 *       201:
 *         description: Menus created successfully
 */
router.post('/bulk', authMiddleware, menuController.bulkCreateMenus.bind(menuController));

/**
 * @swagger
 * /api/menus/{id}:
 *   put:
 *     summary: Update menu item
 *     tags: [Menus]
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
 *               label:
 *                 type: string
 *               path:
 *                 type: string
 *               icon:
 *                 type: string
 *               order:
 *                 type: integer
 *               parentId:
 *                 type: string
 *               requiredPermission:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu updated successfully
 */
router.put('/:id', authMiddleware, menuController.updateMenu.bind(menuController));

/**
 * @swagger
 * /api/menus/{id}:
 *   delete:
 *     summary: Delete menu item
 *     tags: [Menus]
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
 *         description: Menu deleted successfully
 *       400:
 *         description: Cannot delete menu with children
 */
router.delete('/:id', authMiddleware, menuController.deleteMenu.bind(menuController));

export default router;
