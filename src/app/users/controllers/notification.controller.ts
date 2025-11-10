import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import notificationService from '../services/notification.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, NOT_FOUND, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class NotificationController {
  
  /**
   * GET /api/notifications
   * Obtiene las notificaciones del usuario
   */
  public async getNotifications(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      
      const result = await notificationService.getUserNotifications(userId, unreadOnly, limit, skip);
      
      return HttpHandler.success(res, {
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
        page,
        totalPages: Math.ceil(result.total / limit)
      });
      
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to fetch notifications' });
    }
  }
  
  /**
   * GET /api/notifications/unread-count
   * Obtiene el número de notificaciones no leídas
   */
  public async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);
      
      return HttpHandler.success(res, { unreadCount: count });
      
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to fetch unread count' });
    }
  }
  
  /**
   * PUT /api/notifications/:id/read
   * Marca una notificación como leída
   */
  public async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const notification = await notificationService.markAsRead(id, userId);
      
      if (!notification) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Notification not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Notification marked as read',
        notification 
      });
      
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to mark notification as read' });
    }
  }
  
  /**
   * PUT /api/notifications/read-all
   * Marca todas las notificaciones como leídas
   */
  public async markAllAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.markAllAsRead(userId);
      
      return HttpHandler.success(res, { 
        message: `Marked ${count} notifications as read`,
        count 
      });
      
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to mark all as read' });
    }
  }
  
  /**
   * DELETE /api/notifications/:id
   * Elimina una notificación
   */
  public async deleteNotification(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const deleted = await notificationService.deleteNotification(id, userId);
      
      if (!deleted) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Notification not found' });
      }
      
      return HttpHandler.success(res, { message: 'Notification deleted successfully' });
      
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to delete notification' });
    }
  }
  
  /**
   * DELETE /api/notifications/read
   * Elimina todas las notificaciones leídas
   */
  public async deleteReadNotifications(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const count = await notificationService.deleteReadNotifications(userId);
      
      return HttpHandler.success(res, { 
        message: `Deleted ${count} read notifications`,
        count 
      });
      
    } catch (error: any) {
      console.error('Error deleting read notifications:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to delete read notifications' });
    }
  }
}

export default new NotificationController();
