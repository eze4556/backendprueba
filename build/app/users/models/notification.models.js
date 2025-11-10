"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
const mongoose_1 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_CREATED"] = "order_created";
    NotificationType["ORDER_SHIPPED"] = "order_shipped";
    NotificationType["ORDER_DELIVERED"] = "order_delivered";
    NotificationType["ORDER_CANCELLED"] = "order_cancelled";
    NotificationType["PAYMENT_APPROVED"] = "payment_approved";
    NotificationType["PAYMENT_REJECTED"] = "payment_rejected";
    NotificationType["NEW_MESSAGE"] = "new_message";
    NotificationType["NEW_REVIEW"] = "new_review";
    NotificationType["LIVE_STARTED"] = "live_started";
    NotificationType["PRICE_DROP"] = "price_drop";
    NotificationType["RESERVATION_CONFIRMED"] = "reservation_confirmed";
    NotificationType["RESERVATION_REMINDER"] = "reservation_reminder";
    NotificationType["PRODUCT_AVAILABLE"] = "product_available";
    NotificationType["NEW_FOLLOWER"] = "new_follower";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        required: false
    },
    actionUrl: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: false
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
});
// Índices compuestos para consultas eficientes
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
// TTL index: eliminar notificaciones leídas después de 90 días
NotificationSchema.index({ readAt: 1 }, {
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 días
    partialFilterExpression: { read: true }
});
exports.default = (0, mongoose_1.model)('notifications', NotificationSchema);
//# sourceMappingURL=notification.models.js.map