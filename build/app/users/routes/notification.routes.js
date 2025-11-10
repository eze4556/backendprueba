"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/notifications
 * Obtiene todas las notificaciones del usuario
 * Query params: unreadOnly?, limit?, page?
 * Requiere autenticación
 */
// @ts-ignore
router.get('/', auth_middleware_1.authMiddleware, (req, res) => notification_controller_1.default.getNotifications(req, res));
/**
 * GET /api/notifications/unread-count
 * Obtiene el número de notificaciones no leídas
 * Requiere autenticación
 */
// @ts-ignore
router.get('/unread-count', auth_middleware_1.authMiddleware, (req, res) => notification_controller_1.default.getUnreadCount(req, res));
/**
 * PUT /api/notifications/:id/read
 * Marca una notificación como leída
 * Requiere autenticación
 */
// @ts-ignore
router.put('/:id/read', auth_middleware_1.authMiddleware, (req, res) => notification_controller_1.default.markAsRead(req, res));
/**
 * PUT /api/notifications/read-all
 * Marca todas las notificaciones como leídas
 * Requiere autenticación
 */
// @ts-ignore
router.put('/read-all', auth_middleware_1.authMiddleware, (req, res) => notification_controller_1.default.markAllAsRead(req, res));
/**
 * DELETE /api/notifications/:id
 * Elimina una notificación
 * Requiere autenticación
 */
// @ts-ignore
router.delete('/:id', auth_middleware_1.authMiddleware, (req, res) => notification_controller_1.default.deleteNotification(req, res));
/**
 * DELETE /api/notifications/read
 * Elimina todas las notificaciones leídas
 * Requiere autenticación
 */
// @ts-ignore
router.delete('/read', auth_middleware_1.authMiddleware, (req, res) => notification_controller_1.default.deleteReadNotifications(req, res));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map