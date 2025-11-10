import mongoose, { Schema, model } from 'mongoose';

export enum NotificationType {
  ORDER_CREATED = 'order_created',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELLED = 'order_cancelled',
  PAYMENT_APPROVED = 'payment_approved',
  PAYMENT_REJECTED = 'payment_rejected',
  NEW_MESSAGE = 'new_message',
  NEW_REVIEW = 'new_review',
  LIVE_STARTED = 'live_started',
  PRICE_DROP = 'price_drop',
  RESERVATION_CONFIRMED = 'reservation_confirmed',
  RESERVATION_REMINDER = 'reservation_reminder',
  PRODUCT_AVAILABLE = 'product_available',
  NEW_FOLLOWER = 'new_follower'
}

export interface NotificationInterface extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    orderId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    streamId?: mongoose.Types.ObjectId;
    senderId?: mongoose.Types.ObjectId;
    amount?: number;
    [key: string]: any;
  };
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  imageUrl?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<NotificationInterface>({
  userId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.Mixed,
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
NotificationSchema.index(
  { readAt: 1 },
  { 
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 días
    partialFilterExpression: { read: true }
  }
);

export default model<NotificationInterface>('notifications', NotificationSchema);
