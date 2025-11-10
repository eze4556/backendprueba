"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messaging_controller_1 = __importDefault(require("../controllers/messaging.controller"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/messages/send
 * Enviar mensaje
 * Body: { recipientId, text?, type?, attachments? }
 */
router.post('/send', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.sendMessage(req, res);
});
/**
 * GET /api/messages/conversations
 * Obtener conversaciones del usuario
 * Query params: status?, page?, limit?
 */
router.get('/conversations', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.getConversations(req, res);
});
/**
 * GET /api/messages/unread-count
 * Obtener total de mensajes no leídos
 * NOTA: Esta ruta debe estar ANTES de /:conversationId para evitar conflictos
 */
router.get('/unread-count', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.getUnreadCount(req, res);
});
/**
 * GET /api/messages/search
 * Buscar mensajes
 * Query params: q (required), limit?
 * NOTA: Esta ruta debe estar ANTES de /:conversationId para evitar conflictos
 */
router.get('/search', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.searchMessages(req, res);
});
/**
 * GET /api/messages/:conversationId
 * Obtener mensajes de una conversación
 * Query params: page?, limit?
 * NOTA: Esta ruta debe estar DESPUÉS de las rutas específicas
 */
router.get('/:conversationId', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.getMessages(req, res);
});
/**
 * PUT /api/messages/:conversationId/read
 * Marcar mensajes como leídos
 */
router.put('/:conversationId/read', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.markAsRead(req, res);
});
/**
 * PUT /api/messages/:messageId/edit
 * Editar mensaje
 * Body: { text }
 */
router.put('/:messageId/edit', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.editMessage(req, res);
});
/**
 * DELETE /api/messages/:messageId
 * Eliminar mensaje
 */
router.delete('/:messageId', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.deleteMessage(req, res);
});
/**
 * PUT /api/messages/:conversationId/archive
 * Archivar conversación
 */
router.put('/:conversationId/archive', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.archiveConversation(req, res);
});
/**
 * PUT /api/messages/:conversationId/block
 * Bloquear conversación
 */
router.put('/:conversationId/block', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.blockConversation(req, res);
});
/**
 * POST /api/messages/typing
 * Emitir evento de "escribiendo"
 * Body: { conversationId, isTyping }
 */
router.post('/typing', auth_middleware_1.authMiddleware, (req, res) => {
    messaging_controller_1.default.emitTyping(req, res);
});
exports.default = router;
//# sourceMappingURL=messaging.routes.js.map