import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/notifications
 * Obtiene todas las notificaciones del usuario
 * Query params: unreadOnly?, limit?, page?
 * Requiere autenticación
 */
// @ts-ignore
router.get('/', authMiddleware, (req, res) => 
  notificationController.getNotifications(req as any, res)
);

/**
 * GET /api/notifications/unread-count
 * Obtiene el número de notificaciones no leídas
 * Requiere autenticación
 */
// @ts-ignore
router.get('/unread-count', authMiddleware, (req, res) => 
  notificationController.getUnreadCount(req as any, res)
);

/**
 * PUT /api/notifications/:id/read
 * Marca una notificación como leída
 * Requiere autenticación
 */
// @ts-ignore
router.put('/:id/read', authMiddleware, (req, res) => 
  notificationController.markAsRead(req as any, res)
);

/**
 * PUT /api/notifications/read-all
 * Marca todas las notificaciones como leídas
 * Requiere autenticación
 */
// @ts-ignore
router.put('/read-all', authMiddleware, (req, res) => 
  notificationController.markAllAsRead(req as any, res)
);

/**
 * DELETE /api/notifications/:id
 * Elimina una notificación
 * Requiere autenticación
 */
// @ts-ignore
router.delete('/:id', authMiddleware, (req, res) => 
  notificationController.deleteNotification(req as any, res)
);

/**
 * DELETE /api/notifications/read
 * Elimina todas las notificaciones leídas
 * Requiere autenticación
 */
// @ts-ignore
router.delete('/read', authMiddleware, (req, res) => 
  notificationController.deleteReadNotifications(req as any, res)
);

export default router;
