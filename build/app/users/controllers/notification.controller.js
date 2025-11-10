"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const notification_service_1 = __importDefault(require("../services/notification.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class NotificationController {
    /**
     * GET /api/notifications
     * Obtiene las notificaciones del usuario
     */
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const unreadOnly = req.query.unreadOnly === 'true';
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const result = await notification_service_1.default.getUserNotifications(userId, unreadOnly, limit, skip);
            return handler_helper_1.default.success(res, {
                notifications: result.notifications,
                total: result.total,
                unreadCount: result.unreadCount,
                page,
                totalPages: Math.ceil(result.total / limit)
            });
        }
        catch (error) {
            console.error('Error fetching notifications:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to fetch notifications' });
        }
    }
    /**
     * GET /api/notifications/unread-count
     * Obtiene el número de notificaciones no leídas
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await notification_service_1.default.getUnreadCount(userId);
            return handler_helper_1.default.success(res, { unreadCount: count });
        }
        catch (error) {
            console.error('Error fetching unread count:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to fetch unread count' });
        }
    }
    /**
     * PUT /api/notifications/:id/read
     * Marca una notificación como leída
     */
    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const notification = await notification_service_1.default.markAsRead(id, userId);
            if (!notification) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Notification not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Notification marked as read',
                notification
            });
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to mark notification as read' });
        }
    }
    /**
     * PUT /api/notifications/read-all
     * Marca todas las notificaciones como leídas
     */
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const count = await notification_service_1.default.markAllAsRead(userId);
            return handler_helper_1.default.success(res, {
                message: `Marked ${count} notifications as read`,
                count
            });
        }
        catch (error) {
            console.error('Error marking all as read:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to mark all as read' });
        }
    }
    /**
     * DELETE /api/notifications/:id
     * Elimina una notificación
     */
    async deleteNotification(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const deleted = await notification_service_1.default.deleteNotification(id, userId);
            if (!deleted) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Notification not found' });
            }
            return handler_helper_1.default.success(res, { message: 'Notification deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting notification:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to delete notification' });
        }
    }
    /**
     * DELETE /api/notifications/read
     * Elimina todas las notificaciones leídas
     */
    async deleteReadNotifications(req, res) {
        try {
            const userId = req.user.id;
            const count = await notification_service_1.default.deleteReadNotifications(userId);
            return handler_helper_1.default.success(res, {
                message: `Deleted ${count} read notifications`,
                count
            });
        }
        catch (error) {
            console.error('Error deleting read notifications:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to delete read notifications' });
        }
    }
}
exports.default = new NotificationController();
//# sourceMappingURL=notification.controller.js.map