"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stream_controller_1 = require("../controllers/stream.controller");
const token_1 = __importDefault(require("../../auth/token/token"));
const stream_middleware_1 = require("../middleware/stream.middleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/stream
 * @desc    Crear una nueva sesión de streaming
 * @access  Private (Todos los roles EXCEPTO: user)
 */
router.post('/', token_1.default.verifyToken, stream_middleware_1.streamPermissionMiddleware, stream_middleware_1.validateStreamData, stream_middleware_1.streamLimitMiddleware, stream_controller_1.StreamController.createStream);
/**
 * @route   POST /api/stream/:streamId/start
 * @desc    Iniciar el streaming (cambiar estado a LIVE)
 * @access  Private (solo el dueño del stream)
 */
router.post('/:streamId/start', token_1.default.verifyToken, stream_controller_1.StreamController.startStream);
/**
 * @route   POST /api/stream/:streamId/end
 * @desc    Finalizar el streaming
 * @access  Private (solo el dueño del stream)
 */
router.post('/:streamId/end', token_1.default.verifyToken, stream_controller_1.StreamController.endStream);
/**
 * @route   GET /api/stream/:streamId
 * @desc    Obtener información de un stream específico
 * @access  Public
 */
router.get('/:streamId', stream_controller_1.StreamController.getStream);
/**
 * @route   GET /api/stream
 * @desc    Listar streams activos (en vivo)
 * @access  Public
 */
router.get('/', stream_controller_1.StreamController.getActiveStreams);
/**
 * @route   GET /api/stream/my/streams
 * @desc    Obtener streams del usuario actual
 * @access  Private
 */
router.get('/my/streams', token_1.default.verifyToken, stream_controller_1.StreamController.getMyStreams);
/**
 * @route   POST /api/stream/:streamId/join
 * @desc    Unirse a un stream como espectador
 * @access  Private
 */
router.post('/:streamId/join', token_1.default.verifyToken, stream_controller_1.StreamController.joinStream);
/**
 * @route   PATCH /api/stream/:streamId
 * @desc    Actualizar configuración del stream
 * @access  Private (solo el dueño del stream)
 */
router.patch('/:streamId', token_1.default.verifyToken, stream_controller_1.StreamController.updateStream);
exports.default = router;
//# sourceMappingURL=stream.routes.js.map