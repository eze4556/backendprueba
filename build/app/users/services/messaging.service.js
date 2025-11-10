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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_models_1 = __importStar(require("../models/message.models"));
const conversation_models_1 = __importStar(require("../models/conversation.models"));
const notification_service_1 = __importDefault(require("./notification.service"));
const notification_models_1 = require("../models/notification.models");
const server_1 = require("../../../server");
class MessagingService {
    /**
     * Crear o obtener conversación entre dos usuarios
     */
    async getOrCreateConversation(userId1, userId2) {
        // Buscar conversación existente
        let conversation = await conversation_models_1.default.findOne({
            participants: { $all: [userId1, userId2] },
            status: conversation_models_1.ConversationStatus.ACTIVE
        }).populate('participants', 'name email');
        if (!conversation) {
            // Crear nueva conversación
            conversation = await conversation_models_1.default.create({
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
    async sendMessage(senderId, recipientId, text, type = message_models_1.MessageType.TEXT, attachments) {
        // Obtener o crear conversación
        const conversation = await this.getOrCreateConversation(senderId, recipientId);
        // Crear mensaje
        const message = await message_models_1.default.create({
            conversationId: conversation._id,
            senderId,
            recipientId,
            text,
            type,
            attachments,
            status: message_models_1.MessageStatus.SENT
        });
        // Actualizar última actividad de la conversación
        conversation.lastMessage = {
            text: text || (attachments && attachments.length > 0 ? `📎 ${attachments.length} archivo(s)` : ''),
            senderId,
            timestamp: new Date()
        };
        // Incrementar contador de no leídos para el receptor
        await conversation.incrementUnread(recipientId);
        await conversation.save();
        // Poblar datos del mensaje
        await message.populate('senderId', 'name email');
        await message.populate('recipientId', 'name email');
        // Enviar notificación en tiempo real via Socket.IO
        server_1.io.to(`user:${recipientId}`).emit('message:received', {
            conversationId: conversation._id,
            message: message
        });
        // Crear notificación persistente
        await notification_service_1.default.createNotification({
            userId: recipientId,
            type: notification_models_1.NotificationType.NEW_MESSAGE,
            title: 'Nuevo mensaje',
            message: text ? text.substring(0, 100) : 'Te enviaron un archivo',
            actionUrl: `/messages/${conversation._id}`
        });
        return message;
    }
    /**
     * Obtener conversaciones de un usuario
     */
    async getUserConversations(userId, status = conversation_models_1.ConversationStatus.ACTIVE, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {
            participants: userId,
            status
        };
        const total = await conversation_models_1.default.countDocuments(query);
        const conversations = await conversation_models_1.default.find(query)
            .populate('participants', 'name email')
            .sort({ 'lastMessage.timestamp': -1 })
            .skip(skip)
            .limit(limit);
        // Convertir unreadCount a objeto plano para cada conversación
        const conversationsData = conversations.map(conv => {
            const convObj = conv.toObject();
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
    async getConversationMessages(conversationId, userId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        // Verificar que el usuario sea participante
        const conversation = await conversation_models_1.default.findOne({
            _id: conversationId,
            participants: userId
        });
        if (!conversation) {
            throw new Error('Conversation not found or access denied');
        }
        const total = await message_models_1.default.countDocuments({
            conversationId,
            isDeleted: false
        });
        const messages = await message_models_1.default.find({
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
    async markAsRead(conversationId, userId) {
        // Actualizar todos los mensajes no leídos
        await message_models_1.default.updateMany({
            conversationId,
            recipientId: userId,
            status: { $ne: message_models_1.MessageStatus.READ }
        }, {
            status: message_models_1.MessageStatus.READ,
            readAt: new Date()
        });
        // Resetear contador de no leídos
        const conversation = await conversation_models_1.default.findById(conversationId);
        if (conversation) {
            await conversation.resetUnread(userId);
        }
        // Notificar al remitente via Socket.IO
        const messages = await message_models_1.default.find({
            conversationId,
            recipientId: userId
        }).distinct('senderId');
        messages.forEach(senderId => {
            server_1.io.to(`user:${senderId}`).emit('messages:read', {
                conversationId,
                readBy: userId,
                readAt: new Date()
            });
        });
    }
    /**
     * Marcar mensaje como entregado
     */
    async markAsDelivered(messageId) {
        const message = await message_models_1.default.findByIdAndUpdate(messageId, {
            status: message_models_1.MessageStatus.DELIVERED,
            deliveredAt: new Date()
        }, { new: true });
        if (message) {
            server_1.io.to(`user:${message.senderId}`).emit('message:delivered', {
                messageId: message._id,
                deliveredAt: message.deliveredAt
            });
        }
    }
    /**
     * Editar mensaje
     */
    async editMessage(messageId, userId, newText) {
        const message = await message_models_1.default.findOne({
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
        server_1.io.to(`user:${message.recipientId}`).emit('message:edited', {
            messageId: message._id,
            newText,
            editedAt: message.editedAt
        });
        return message;
    }
    /**
     * Eliminar mensaje
     */
    async deleteMessage(messageId, userId) {
        const message = await message_models_1.default.findOne({
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
        server_1.io.to(`user:${message.recipientId}`).emit('message:deleted', {
            messageId: message._id,
            deletedAt: message.deletedAt
        });
    }
    /**
     * Archivar conversación
     */
    async archiveConversation(conversationId, userId) {
        const conversation = await conversation_models_1.default.findOne({
            _id: conversationId,
            participants: userId
        });
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        conversation.status = conversation_models_1.ConversationStatus.ARCHIVED;
        await conversation.save();
    }
    /**
     * Bloquear conversación
     */
    async blockConversation(conversationId, userId) {
        const conversation = await conversation_models_1.default.findOne({
            _id: conversationId,
            participants: userId
        });
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        conversation.status = conversation_models_1.ConversationStatus.BLOCKED;
        await conversation.save();
    }
    /**
     * Obtener total de mensajes no leídos
     */
    async getUnreadCount(userId) {
        const conversations = await conversation_models_1.default.find({
            participants: userId,
            status: conversation_models_1.ConversationStatus.ACTIVE
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
    emitTyping(conversationId, userId, isTyping) {
        server_1.io.to(`conversation:${conversationId}`).emit('user:typing', {
            userId,
            isTyping
        });
    }
    /**
     * Buscar mensajes
     */
    async searchMessages(userId, query, limit = 20) {
        // Obtener conversaciones del usuario
        const conversations = await conversation_models_1.default.find({
            participants: userId
        }).distinct('_id');
        const messages = await message_models_1.default.find({
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
exports.default = new MessagingService();
//# sourceMappingURL=messaging.service.js.map