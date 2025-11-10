import express from 'express';
import { StreamController } from '../controllers/stream.controller';
import Token from '../../auth/token/token';
import { 
  streamPermissionMiddleware, 
  streamLimitMiddleware,
  validateStreamData 
} from '../middleware/stream.middleware';

const router = express.Router();

/**
 * @route   POST /api/stream
 * @desc    Crear una nueva sesión de streaming
 * @access  Private (Todos los roles EXCEPTO: user)
 */
router.post(
  '/', 
  Token.verifyToken, 
  streamPermissionMiddleware as any,
  validateStreamData as any,
  streamLimitMiddleware as any,
  StreamController.createStream as any
);

/**
 * @route   POST /api/stream/:streamId/start
 * @desc    Iniciar el streaming (cambiar estado a LIVE)
 * @access  Private (solo el dueño del stream)
 */
router.post('/:streamId/start', Token.verifyToken, StreamController.startStream as any);

/**
 * @route   POST /api/stream/:streamId/end
 * @desc    Finalizar el streaming
 * @access  Private (solo el dueño del stream)
 */
router.post('/:streamId/end', Token.verifyToken, StreamController.endStream as any);

/**
 * @route   GET /api/stream/:streamId
 * @desc    Obtener información de un stream específico
 * @access  Public
 */
router.get('/:streamId', StreamController.getStream);

/**
 * @route   GET /api/stream
 * @desc    Listar streams activos (en vivo)
 * @access  Public
 */
router.get('/', StreamController.getActiveStreams);

/**
 * @route   GET /api/stream/my/streams
 * @desc    Obtener streams del usuario actual
 * @access  Private
 */
router.get('/my/streams', Token.verifyToken, StreamController.getMyStreams as any);

/**
 * @route   POST /api/stream/:streamId/join
 * @desc    Unirse a un stream como espectador
 * @access  Private
 */
router.post('/:streamId/join', Token.verifyToken, StreamController.joinStream as any);

/**
 * @route   PATCH /api/stream/:streamId
 * @desc    Actualizar configuración del stream
 * @access  Private (solo el dueño del stream)
 */
router.patch('/:streamId', Token.verifyToken, StreamController.updateStream as any);

export default router;
