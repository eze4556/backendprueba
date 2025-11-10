import Notification, { NotificationInterface, NotificationType } from '../models/notification.models';
import mongoose from 'mongoose';

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  imageUrl?: string;
}

class NotificationService {
  
  /**
   * Crea una nueva notificación
   */
  public async createNotification(data: CreateNotificationData): Promise<NotificationInterface> {
    const notification = new Notification({
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
  public async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false,
    limit: number = 20,
    skip: number = 0
  ): Promise<{ notifications: NotificationInterface[]; total: number; unreadCount: number }> {
    const query: any = { userId };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, read: false })
    ]);
    
    return { notifications, total, unreadCount };
  }
  
  /**
   * Marca una notificación como leída
   */
  public async markAsRead(notificationId: string, userId: string): Promise<NotificationInterface | null> {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    return notification;
  }
  
  /**
   * Marca todas las notificaciones como leídas
   */
  public async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    );
    
    return result.modifiedCount;
  }
  
  /**
   * Elimina una notificación
   */
  public async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    return result.deletedCount > 0;
  }
  
  /**
   * Elimina todas las notificaciones leídas
   */
  public async deleteReadNotifications(userId: string): Promise<number> {
    const result = await Notification.deleteMany({ userId, read: true });
    return result.deletedCount;
  }
  
  /**
   * Obtiene el número de notificaciones no leídas
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({ userId, read: false });
  }
  
  // Métodos helpers para crear notificaciones específicas
  
  public async notifyOrderCreated(userId: string, orderNumber: string, orderId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_CREATED,
      title: '¡Orden creada!',
      message: `Tu orden ${orderNumber} ha sido creada exitosamente`,
      data: { orderId },
      actionUrl: `/orders/${orderId}`
    });
  }
  
  public async notifyOrderShipped(userId: string, orderNumber: string, orderId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_SHIPPED,
      title: '¡Tu orden ha sido enviada!',
      message: `Tu orden ${orderNumber} está en camino`,
      data: { orderId },
      actionUrl: `/orders/${orderId}/tracking`
    });
  }
  
  public async notifyOrderDelivered(userId: string, orderNumber: string, orderId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.ORDER_DELIVERED,
      title: '¡Orden entregada!',
      message: `Tu orden ${orderNumber} ha sido entregada`,
      data: { orderId },
      actionUrl: `/orders/${orderId}`
    });
  }
  
  public async notifyPaymentApproved(userId: string, orderNumber: string, amount: number): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.PAYMENT_APPROVED,
      title: '✅ Pago aprobado',
      message: `Tu pago de $${amount.toFixed(2)} ha sido aprobado para la orden ${orderNumber}`,
      data: { amount }
    });
  }
  
  public async notifyPaymentRejected(userId: string, orderNumber: string, reason?: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.PAYMENT_REJECTED,
      title: '❌ Pago rechazado',
      message: `Tu pago para la orden ${orderNumber} fue rechazado. ${reason || 'Por favor intenta con otro método de pago'}`,
      actionUrl: `/orders/payment`
    });
  }
  
  public async notifyNewMessage(userId: string, senderName: string, senderId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.NEW_MESSAGE,
      title: '💬 Nuevo mensaje',
      message: `${senderName} te ha enviado un mensaje`,
      data: { senderId },
      actionUrl: `/messages/${senderId}`
    });
  }
  
  public async notifyNewReview(userId: string, productName: string, rating: number): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.NEW_REVIEW,
      title: '⭐ Nueva reseña',
      message: `Tu producto "${productName}" recibió una reseña de ${rating} estrellas`,
      actionUrl: `/products/reviews`
    });
  }
  
  public async notifyLiveStarted(userIds: string[], streamerName: string, streamId: string): Promise<void> {
    const notifications = userIds.map(userId => ({
      userId,
      type: NotificationType.LIVE_STARTED,
      title: '🔴 Live iniciado',
      message: `${streamerName} ha iniciado una transmisión en vivo`,
      data: { streamId },
      actionUrl: `/live/${streamId}`
    }));
    
    await Notification.insertMany(notifications);
  }
  
  public async notifyPriceDrop(userId: string, productName: string, oldPrice: number, newPrice: number, productId: string): Promise<void> {
    const discount = ((oldPrice - newPrice) / oldPrice * 100).toFixed(0);
    await this.createNotification({
      userId,
      type: NotificationType.PRICE_DROP,
      title: '🔥 Bajó el precio!',
      message: `${productName} ahora está ${discount}% más barato: $${newPrice.toFixed(2)}`,
      data: { productId, oldPrice, newPrice },
      actionUrl: `/products/${productId}`
    });
  }
  
  public async notifyReservationConfirmed(userId: string, professionalName: string, date: Date): Promise<void> {
    const dateStr = date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await this.createNotification({
      userId,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: '✅ Reserva confirmada',
      message: `Tu reserva con ${professionalName} para el ${dateStr} ha sido confirmada`,
      actionUrl: `/reservations`
    });
  }
}

export default new NotificationService();
