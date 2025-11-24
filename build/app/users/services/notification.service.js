"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const notification_models_1 = __importStar(require("../models/notification.models"));
class NotificationService {
    /**
     * Crea una nueva notificación
     */
    async createNotification(data) {
        const notification = new notification_models_1.default({
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            actionUrl: data.actionUrl,
            imageUrl: data.imageUrl
        });
        await notification.save();
        // Aquí se podría emitir un evento Socket.IO para notificaciones en tiempo real
        // socketService.emitToUser(data.userId, 'notification:new', notification);
        return notification;
    }
    /**
     * Obtiene notificaciones de un usuario con paginación
     */
    async getUserNotifications(userId, unreadOnly = false, limit = 20, skip = 0) {
        const query = { userId };
        if (unreadOnly) {
            query.read = false;
        }
        const [notifications, total, unreadCount] = await Promise.all([
            notification_models_1.default.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip),
            notification_models_1.default.countDocuments(query),
            notification_models_1.default.countDocuments({ userId, read: false })
        ]);
        return { notifications, total, unreadCount };
    }
    /**
     * Marca una notificación como leída
     */
    async markAsRead(notificationId, userId) {
        const notification = await notification_models_1.default.findOneAndUpdate({ _id: notificationId, userId }, {
            read: true,
            readAt: new Date()
        }, { new: true });
        return notification;
    }
    /**
     * Marca todas las notificaciones como leídas
     */
    async markAllAsRead(userId) {
        const result = await notification_models_1.default.updateMany({ userId, read: false }, {
            read: true,
            readAt: new Date()
        });
        return result.modifiedCount;
    }
    /**
     * Elimina una notificación
     */
    async deleteNotification(notificationId, userId) {
        const result = await notification_models_1.default.deleteOne({ _id: notificationId, userId });
        return result.deletedCount > 0;
    }
    /**
     * Elimina todas las notificaciones leídas
     */
    async deleteReadNotifications(userId) {
        const result = await notification_models_1.default.deleteMany({ userId, read: true });
        return result.deletedCount;
    }
    /**
     * Obtiene el número de notificaciones no leídas
     */
    async getUnreadCount(userId) {
        return await notification_models_1.default.countDocuments({ userId, read: false });
    }
    // Métodos helpers para crear notificaciones específicas
    async notifyOrderCreated(userId, orderNumber, orderId) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.ORDER_CREATED,
            title: '¡Orden creada!',
            message: `Tu orden ${orderNumber} ha sido creada exitosamente`,
            data: { orderId },
            actionUrl: `/orders/${orderId}`
        });
    }
    async notifyOrderShipped(userId, orderNumber, orderId) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.ORDER_SHIPPED,
            title: '¡Tu orden ha sido enviada!',
            message: `Tu orden ${orderNumber} está en camino`,
            data: { orderId },
            actionUrl: `/orders/${orderId}/tracking`
        });
    }
    async notifyOrderDelivered(userId, orderNumber, orderId) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.ORDER_DELIVERED,
            title: '¡Orden entregada!',
            message: `Tu orden ${orderNumber} ha sido entregada`,
            data: { orderId },
            actionUrl: `/orders/${orderId}`
        });
    }
    async notifyPaymentApproved(userId, orderNumber, amount) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.PAYMENT_APPROVED,
            title: '✅ Pago aprobado',
            message: `Tu pago de $${amount.toFixed(2)} ha sido aprobado para la orden ${orderNumber}`,
            data: { amount }
        });
    }
    async notifyPaymentRejected(userId, orderNumber, reason) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.PAYMENT_REJECTED,
            title: '❌ Pago rechazado',
            message: `Tu pago para la orden ${orderNumber} fue rechazado. ${reason || 'Por favor intenta con otro método de pago'}`,
            actionUrl: `/orders/payment`
        });
    }
    async notifyNewMessage(userId, senderName, senderId) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.NEW_MESSAGE,
            title: '💬 Nuevo mensaje',
            message: `${senderName} te ha enviado un mensaje`,
            data: { senderId },
            actionUrl: `/messages/${senderId}`
        });
    }
    async notifyNewReview(userId, productName, rating) {
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.NEW_REVIEW,
            title: '⭐ Nueva reseña',
            message: `Tu producto "${productName}" recibió una reseña de ${rating} estrellas`,
            actionUrl: `/products/reviews`
        });
    }
    async notifyLiveStarted(userIds, streamerName, streamId) {
        const notifications = userIds.map(userId => ({
            userId,
            type: notification_models_1.NotificationType.LIVE_STARTED,
            title: '🔴 Live iniciado',
            message: `${streamerName} ha iniciado una transmisión en vivo`,
            data: { streamId },
            actionUrl: `/live/${streamId}`
        }));
        await notification_models_1.default.insertMany(notifications);
    }
    async notifyPriceDrop(userId, productName, oldPrice, newPrice, productId) {
        const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.PRICE_DROP,
            title: '🔥 Bajó el precio!',
            message: `${productName} ahora está ${discount}% más barato: $${newPrice.toFixed(2)}`,
            data: { productId, oldPrice, newPrice },
            actionUrl: `/products/${productId}`
        });
    }
    async notifyReservationConfirmed(userId, professionalName, date) {
        const dateStr = date.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        await this.createNotification({
            userId,
            type: notification_models_1.NotificationType.RESERVATION_CONFIRMED,
            title: '✅ Reserva confirmada',
            message: `Tu reserva con ${professionalName} para el ${dateStr} ha sido confirmada`,
            actionUrl: `/reservations`
        });
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notification.service.js.map