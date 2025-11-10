"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messaging_service_1 = __importDefault(require("../services/messaging.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const message_models_1 = require("../models/message.models");
const conversation_models_1 = require("../models/conversation.models");
const mongoose_1 = __importDefault(require("mongoose"));
class MessagingController {
    /**
     * POST /api/messages/send
     * Enviar mensaje
     */
    async sendMessage(req, res) {
        try {
            const senderId = req.user.id;
            const { recipientId, text, type, attachments } = req.body;
            if (!recipientId) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'recipientId is required'
                });
            }
            // Validar ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(recipientId)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Invalid recipientId format'
                });
            }
            if (!text && (!attachments || attachments.length === 0)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'text or attachments are required'
                });
            }
            const message = await messaging_service_1.default.sendMessage(senderId, recipientId, text, type || message_models_1.MessageType.TEXT, attachments);
            return handler_helper_1.default.success(res, {
                message: 'Message sent successfully',
                data: message
            }, codes_constanst_1.CREATED);
        }
        catch (error) {
            console.error('Error sending message:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to send message'
            });
        }
    }
    /**
     * GET /api/messages/conversations
     * Obtener conversaciones del usuario
     */
    async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const { status, page = 1, limit = 20 } = req.query;
            const result = await messaging_service_1.default.getUserConversations(userId, status || conversation_models_1.ConversationStatus.ACTIVE, parseInt(page), parseInt(limit));
            return handler_helper_1.default.success(res, result);
        }
        catch (error) {
            console.error('Error getting conversations:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get conversations'
            });
        }
    }
    /**
     * GET /api/messages/:conversationId
     * Obtener mensajes de una conversación
     */
    async getMessages(req, res) {
        try {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const { page = 1, limit = 50 } = req.query;
            const result = await messaging_service_1.default.getConversationMessages(conversationId, userId, parseInt(page), parseInt(limit));
            return handler_helper_1.default.success(res, result);
        }
        catch (error) {
            console.error('Error getting messages:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Conversation not found or access denied' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get messages'
            });
        }
    }
    /**
     * PUT /api/messages/:conversationId/read
     * Marcar mensajes como leídos
     */
    async markAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { conversationId } = req.params;
            await messaging_service_1.default.markAsRead(conversationId, userId);
            return handler_helper_1.default.success(res, {
                message: 'Messages marked as read'
            });
        }
        catch (error) {
            console.error('Error marking as read:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to mark messages as read'
            });
        }
    }
    /**
     * PUT /api/messages/:messageId/edit
     * Editar mensaje
     */
    async editMessage(req, res) {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            const { text } = req.body;
            if (!text || text.trim().length === 0) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'text is required'
                });
            }
            const message = await messaging_service_1.default.editMessage(messageId, userId, text);
            return handler_helper_1.default.success(res, {
                message: 'Message edited successfully',
                data: message
            });
        }
        catch (error) {
            console.error('Error editing message:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Message not found or cannot be edited' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to edit message'
            });
        }
    }
    /**
     * DELETE /api/messages/:messageId
     * Eliminar mensaje
     */
    async deleteMessage(req, res) {
        try {
            const userId = req.user.id;
            const { messageId } = req.params;
            await messaging_service_1.default.deleteMessage(messageId, userId);
            return handler_helper_1.default.success(res, {
                message: 'Message deleted successfully'
            });
        }
        catch (error) {
            console.error('Error deleting message:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Message not found or cannot be deleted' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to delete message'
            });
        }
    }
    /**
     * PUT /api/messages/:conversationId/archive
     * Archivar conversación
     */
    async archiveConversation(req, res) {
        try {
            const userId = req.user.id;
            const { conversationId } = req.params;
            await messaging_service_1.default.archiveConversation(conversationId, userId);
            return handler_helper_1.default.success(res, {
                message: 'Conversation archived successfully'
            });
        }
        catch (error) {
            console.error('Error archiving conversation:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Conversation not found' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to archive conversation'
            });
        }
    }
    /**
     * PUT /api/messages/:conversationId/block
     * Bloquear conversación
     */
    async blockConversation(req, res) {
        try {
            const userId = req.user.id;
            const { conversationId } = req.params;
            await messaging_service_1.default.blockConversation(conversationId, userId);
            return handler_helper_1.default.success(res, {
                message: 'Conversation blocked successfully'
            });
        }
        catch (error) {
            console.error('Error blocking conversation:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Conversation not found' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to block conversation'
            });
        }
    }
    /**
     * GET /api/messages/unread-count
     * Obtener total de mensajes no leídos
     */
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await messaging_service_1.default.getUnreadCount(userId);
            return handler_helper_1.default.success(res, { unreadCount: count });
        }
        catch (error) {
            console.error('Error getting unread count:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get unread count'
            });
        }
    }
    /**
     * POST /api/messages/typing
     * Emitir evento de "escribiendo"
     */
    async emitTyping(req, res) {
        try {
            const userId = req.user.id;
            const { conversationId, isTyping } = req.body;
            if (!conversationId || typeof isTyping !== 'boolean') {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'conversationId and isTyping are required'
                });
            }
            messaging_service_1.default.emitTyping(conversationId, userId, isTyping);
            return handler_helper_1.default.success(res, {
                message: 'Typing event emitted'
            });
        }
        catch (error) {
            console.error('Error emitting typing:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to emit typing event'
            });
        }
    }
    /**
     * GET /api/messages/search
     * Buscar mensajes
     */
    async searchMessages(req, res) {
        try {
            const userId = req.user.id;
            const { q, limit = 20 } = req.query;
            if (!q || typeof q !== 'string') {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Search query is required'
                });
            }
            const messages = await messaging_service_1.default.searchMessages(userId, q, parseInt(limit));
            return handler_helper_1.default.success(res, { messages });
        }
        catch (error) {
            console.error('Error searching messages:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to search messages'
            });
        }
    }
}
exports.default = new MessagingController();
//# sourceMappingURL=messaging.controller.js.map