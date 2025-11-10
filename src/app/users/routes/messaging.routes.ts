import { Router } from 'express';
import messagingController from '../controllers/messaging.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/messages/send
 * Enviar mensaje
 * Body: { recipientId, text?, type?, attachments? }
 */
router.post('/send', authMiddleware, (req, res) => {
  messagingController.sendMessage(req as any, res);
});

/**
 * GET /api/messages/conversations
 * Obtener conversaciones del usuario
 * Query params: status?, page?, limit?
 */
router.get('/conversations', authMiddleware, (req, res) => {
  messagingController.getConversations(req as any, res);
});

/**
 * GET /api/messages/unread-count
 * Obtener total de mensajes no leídos
 * NOTA: Esta ruta debe estar ANTES de /:conversationId para evitar conflictos
 */
router.get('/unread-count', authMiddleware, (req, res) => {
  messagingController.getUnreadCount(req as any, res);
});

/**
 * GET /api/messages/search
 * Buscar mensajes
 * Query params: q (required), limit?
 * NOTA: Esta ruta debe estar ANTES de /:conversationId para evitar conflictos
 */
router.get('/search', authMiddleware, (req, res) => {
  messagingController.searchMessages(req as any, res);
});

/**
 * GET /api/messages/:conversationId
 * Obtener mensajes de una conversación
 * Query params: page?, limit?
 * NOTA: Esta ruta debe estar DESPUÉS de las rutas específicas
 */
router.get('/:conversationId', authMiddleware, (req, res) => {
  messagingController.getMessages(req as any, res);
});

/**
 * PUT /api/messages/:conversationId/read
 * Marcar mensajes como leídos
 */
router.put('/:conversationId/read', authMiddleware, (req, res) => {
  messagingController.markAsRead(req as any, res);
});

/**
 * PUT /api/messages/:messageId/edit
 * Editar mensaje
 * Body: { text }
 */
router.put('/:messageId/edit', authMiddleware, (req, res) => {
  messagingController.editMessage(req as any, res);
});

/**
 * DELETE /api/messages/:messageId
 * Eliminar mensaje
 */
router.delete('/:messageId', authMiddleware, (req, res) => {
  messagingController.deleteMessage(req as any, res);
});

/**
 * PUT /api/messages/:conversationId/archive
 * Archivar conversación
 */
router.put('/:conversationId/archive', authMiddleware, (req, res) => {
  messagingController.archiveConversation(req as any, res);
});

/**
 * PUT /api/messages/:conversationId/block
 * Bloquear conversación
 */
router.put('/:conversationId/block', authMiddleware, (req, res) => {
  messagingController.blockConversation(req as any, res);
});

/**
 * POST /api/messages/typing
 * Emitir evento de "escribiendo"
 * Body: { conversationId, isTyping }
 */
router.post('/typing', authMiddleware, (req, res) => {
  messagingController.emitTyping(req as any, res);
});

export default router;
