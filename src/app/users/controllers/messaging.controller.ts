import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import messagingService from '../services/messaging.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_ERROR, CREATED } from '../../../constants/codes.constanst';
import { MessageType } from '../models/message.models';
import { ConversationStatus } from '../models/conversation.models';
import mongoose from 'mongoose';

class MessagingController {
  
  /**
   * POST /api/messages/send
   * Enviar mensaje
   */
  public async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const senderId = req.user!.id;
      const { recipientId, text, type, attachments } = req.body;
      
      if (!recipientId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'recipientId is required'
        });
      }

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Invalid recipientId format'
        });
      }
      
      if (!text && (!attachments || attachments.length === 0)) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'text or attachments are required'
        });
      }
      
      const message = await messagingService.sendMessage(
        senderId,
        recipientId,
        text,
        type || MessageType.TEXT,
        attachments
      );
      
      return HttpHandler.success(res, {
        message: 'Message sent successfully',
        data: message
      }, CREATED);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to send message'
      });
    }
  }
  
  /**
   * GET /api/messages/conversations
   * Obtener conversaciones del usuario
   */
  public async getConversations(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { status, page = 1, limit = 20 } = req.query;
      
      const result = await messagingService.getUserConversations(
        userId,
        (status as ConversationStatus) || ConversationStatus.ACTIVE,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, result);
      
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to get conversations'
      });
    }
  }
  
  /**
   * GET /api/messages/:conversationId
   * Obtener mensajes de una conversación
   */
  public async getMessages(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const result = await messagingService.getConversationMessages(
        conversationId,
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, result);
      
    } catch (error: any) {
      console.error('Error getting messages:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Conversation not found or access denied' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to get messages'
      });
    }
  }
  
  /**
   * PUT /api/messages/:conversationId/read
   * Marcar mensajes como leídos
   */
  public async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      await messagingService.markAsRead(conversationId, userId);
      
      return HttpHandler.success(res, {
        message: 'Messages marked as read'
      });
      
    } catch (error: any) {
      console.error('Error marking as read:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to mark messages as read'
      });
    }
  }
  
  /**
   * PUT /api/messages/:messageId/edit
   * Editar mensaje
   */
  public async editMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      const { text } = req.body;
      
      if (!text || text.trim().length === 0) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'text is required'
        });
      }
      
      const message = await messagingService.editMessage(messageId, userId, text);
      
      return HttpHandler.success(res, {
        message: 'Message edited successfully',
        data: message
      });
      
    } catch (error: any) {
      console.error('Error editing message:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Message not found or cannot be edited' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to edit message'
      });
    }
  }
  
  /**
   * DELETE /api/messages/:messageId
   * Eliminar mensaje
   */
  public async deleteMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { messageId } = req.params;
      
      await messagingService.deleteMessage(messageId, userId);
      
      return HttpHandler.success(res, {
        message: 'Message deleted successfully'
      });
      
    } catch (error: any) {
      console.error('Error deleting message:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Message not found or cannot be deleted' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to delete message'
      });
    }
  }
  
  /**
   * PUT /api/messages/:conversationId/archive
   * Archivar conversación
   */
  public async archiveConversation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      await messagingService.archiveConversation(conversationId, userId);
      
      return HttpHandler.success(res, {
        message: 'Conversation archived successfully'
      });
      
    } catch (error: any) {
      console.error('Error archiving conversation:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Conversation not found' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to archive conversation'
      });
    }
  }
  
  /**
   * PUT /api/messages/:conversationId/block
   * Bloquear conversación
   */
  public async blockConversation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      await messagingService.blockConversation(conversationId, userId);
      
      return HttpHandler.success(res, {
        message: 'Conversation blocked successfully'
      });
      
    } catch (error: any) {
      console.error('Error blocking conversation:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Conversation not found' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to block conversation'
      });
    }
  }
  
  /**
   * GET /api/messages/unread-count
   * Obtener total de mensajes no leídos
   */
  public async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      
      const count = await messagingService.getUnreadCount(userId);
      
      return HttpHandler.success(res, { unreadCount: count });
      
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to get unread count'
      });
    }
  }
  
  /**
   * POST /api/messages/typing
   * Emitir evento de "escribiendo"
   */
  public async emitTyping(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { conversationId, isTyping } = req.body;
      
      if (!conversationId || typeof isTyping !== 'boolean') {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'conversationId and isTyping are required'
        });
      }
      
      messagingService.emitTyping(conversationId, userId, isTyping);
      
      return HttpHandler.success(res, {
        message: 'Typing event emitted'
      });
      
    } catch (error: any) {
      console.error('Error emitting typing:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to emit typing event'
      });
    }
  }
  
  /**
   * GET /api/messages/search
   * Buscar mensajes
   */
  public async searchMessages(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { q, limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Search query is required'
        });
      }
      
      const messages = await messagingService.searchMessages(
        userId,
        q,
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, { messages });
      
    } catch (error: any) {
      console.error('Error searching messages:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to search messages'
      });
    }
  }
}

export default new MessagingController();
