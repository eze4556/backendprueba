import Message, { MessageStatus, MessageType } from '../models/message.models';
import Conversation, { ConversationStatus } from '../models/conversation.models';
import notificationService from './notification.service';
import { NotificationType } from '../models/notification.models';
import { io } from '../../../server';

class MessagingService {
  
  /**
   * Crear o obtener conversación entre dos usuarios
   */
  public async getOrCreateConversation(userId1: string, userId2: string): Promise<any> {
    // Buscar conversación existente
    let conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
      status: ConversationStatus.ACTIVE
    }).populate('participants', 'name email');
    
    if (!conversation) {
      // Crear nueva conversación
      conversation = await Conversation.create({
        participants: [userId1, userId2],
        unreadCount: new Map([
          [userId1, 0],
          [userId2, 0]
        ])
      });
      
      await conversation.populate('participants', 'name email');
    }
    
    return conversation;
  }
  
  /**
   * Enviar mensaje
   */
  public async sendMessage(
    senderId: string,
    recipientId: string,
    text?: string,
    type: MessageType = MessageType.TEXT,
    attachments?: any[]
  ): Promise<any> {
    // Obtener o crear conversación
    const conversation = await this.getOrCreateConversation(senderId, recipientId);
    
    // Crear mensaje
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      recipientId,
      text,
      type,
      attachments,
      status: MessageStatus.SENT
    });
    
    // Actualizar última actividad de la conversación
    conversation.lastMessage = {
      text: text || (attachments && attachments.length > 0 ? `📎 ${attachments.length} archivo(s)` : ''),
      senderId,
      timestamp: new Date()
    };
    
    // Incrementar contador de no leídos para el receptor
    await (conversation as any).incrementUnread(recipientId);
    
    await conversation.save();
    
    // Poblar datos del mensaje
    await message.populate('senderId', 'name email');
    await message.populate('recipientId', 'name email');
    
    // Enviar notificación en tiempo real via Socket.IO
    (io as any).to(`user:${recipientId}`).emit('message:received', {
      conversationId: conversation._id,
      message: message
    });
    
    // Crear notificación persistente
    await notificationService.createNotification({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'Nuevo mensaje',
      message: text ? text.substring(0, 100) : 'Te enviaron un archivo',
      actionUrl: `/messages/${conversation._id}`
    });
    
    return message;
  }
  
  /**
   * Obtener conversaciones de un usuario
   */
  public async getUserConversations(
    userId: string,
    status: ConversationStatus = ConversationStatus.ACTIVE,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    const query: any = {
      participants: userId,
      status
    };
    
    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .populate('participants', 'name email')
      .sort({ 'lastMessage.timestamp': -1 })
      .skip(skip)
      .limit(limit);
    
    // Convertir unreadCount a objeto plano para cada conversación
    const conversationsData = conversations.map(conv => {
      const convObj: any = conv.toObject();
      convObj.unreadCount = Object.fromEntries(conv.unreadCount);
      return convObj;
    });
    
    return {
      conversations: conversationsData,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  }
  
  /**
   * Obtener mensajes de una conversación
   */
  public async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    // Verificar que el usuario sea participante
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }
    
    const total = await Message.countDocuments({
      conversationId,
      isDeleted: false
    });
    
    const messages = await Message.find({
      conversationId,
      isDeleted: false
    })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      messages: messages.reverse(), // Orden cronológico
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  }
  
  /**
   * Marcar mensajes como leídos
   */
  public async markAsRead(conversationId: string, userId: string): Promise<void> {
    // Actualizar todos los mensajes no leídos
    await Message.updateMany(
      {
        conversationId,
        recipientId: userId,
        status: { $ne: MessageStatus.READ }
      },
      {
        status: MessageStatus.READ,
        readAt: new Date()
      }
    );
    
    // Resetear contador de no leídos
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      await (conversation as any).resetUnread(userId);
    }
    
    // Notificar al remitente via Socket.IO
    const messages = await Message.find({
      conversationId,
      recipientId: userId
    }).distinct('senderId');
    
    messages.forEach(senderId => {
      (io as any).to(`user:${senderId}`).emit('messages:read', {
        conversationId,
        readBy: userId,
        readAt: new Date()
      });
    });
  }
  
  /**
   * Marcar mensaje como entregado
   */
  public async markAsDelivered(messageId: string): Promise<void> {
    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        status: MessageStatus.DELIVERED,
        deliveredAt: new Date()
      },
      { new: true }
    );
    
    if (message) {
      (io as any).to(`user:${message.senderId}`).emit('message:delivered', {
        messageId: message._id,
        deliveredAt: message.deliveredAt
      });
    }
  }
  
  /**
   * Editar mensaje
   */
  public async editMessage(messageId: string, userId: string, newText: string): Promise<any> {
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
      isDeleted: false
    });
    
    if (!message) {
      throw new Error('Message not found or cannot be edited');
    }
    
    message.text = newText;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    
    // Notificar al receptor
    (io as any).to(`user:${message.recipientId}`).emit('message:edited', {
      messageId: message._id,
      newText,
      editedAt: message.editedAt
    });
    
    return message;
  }
  
  /**
   * Eliminar mensaje
   */
  public async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await Message.findOne({
      _id: messageId,
      senderId: userId,
      isDeleted: false
    });
    
    if (!message) {
      throw new Error('Message not found or cannot be deleted');
    }
    
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    
    // Notificar al receptor
    (io as any).to(`user:${message.recipientId}`).emit('message:deleted', {
      messageId: message._id,
      deletedAt: message.deletedAt
    });
  }
  
  /**
   * Archivar conversación
   */
  public async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    conversation.status = ConversationStatus.ARCHIVED;
    await conversation.save();
  }
  
  /**
   * Bloquear conversación
   */
  public async blockConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    conversation.status = ConversationStatus.BLOCKED;
    await conversation.save();
  }
  
  /**
   * Obtener total de mensajes no leídos
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const conversations = await Conversation.find({
      participants: userId,
      status: ConversationStatus.ACTIVE
    });
    
    let total = 0;
    conversations.forEach(conv => {
      const count = conv.unreadCount.get(userId) || 0;
      total += count;
    });
    
    return total;
  }
  
  /**
   * Emitir evento de "escribiendo"
   */
  public emitTyping(conversationId: string, userId: string, isTyping: boolean): void {
    (io as any).to(`conversation:${conversationId}`).emit('user:typing', {
      userId,
      isTyping
    });
  }
  
  /**
   * Buscar mensajes
   */
  public async searchMessages(
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<any[]> {
    // Obtener conversaciones del usuario
    const conversations = await Conversation.find({
      participants: userId
    }).distinct('_id');
    
    const messages = await Message.find({
      conversationId: { $in: conversations },
      text: { $regex: query, $options: 'i' },
      isDeleted: false
    })
      .populate('senderId', 'name email')
      .populate('recipientId', 'name email')
      .populate('conversationId')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return messages;
  }
}

export default new MessagingService();
