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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSocketManager = void 0;
const socket_io_1 = require("socket.io");
const stream_model_1 = __importDefault(require("../models/stream.model"));
const chatMessage_model_1 = __importStar(require("../models/chatMessage.model"));
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('StreamSocket');
class StreamSocketManager {
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env["FRONTEND_URL"] || '*',
                methods: ['GET', 'POST'],
                credentials: true
            },
            path: '/socket.io/',
            transports: ['websocket', 'polling']
        });
        this.setupEventHandlers();
        logger.info('Socket.IO configurado para streaming');
    }
    setupEventHandlers() {
        // ...existing code...
        this.io.on('connection', (socket) => {
            logger.info(`Cliente conectado: ${socket.id}`);
            // Evento: Solicitud de nueva oferta desde un viewer
            socket.on('request-offer', async (data) => {
                try {
                    const { streamId, streamerUserId, requestingUserId } = data;
                    // Buscar el socket del streamer
                    const streamerSocket = await this.findSocketByUserId(streamId, streamerUserId);
                    if (streamerSocket) {
                        streamerSocket.emit('request-offer', {
                            streamId,
                            streamerUserId,
                            requestingUserId // <--- siempre el viewer real
                        });
                        logger.info(`Solicitud de nueva oferta reenviada al streamer (${streamerUserId}) para viewer (${requestingUserId}) en stream ${streamId}`);
                    }
                    else {
                        logger.warn(`No se encontró el socket del streamer (${streamerUserId}) para reenviar la solicitud de oferta en stream ${streamId}`);
                    }
                }
                catch (error) {
                    logger.error('Error al reenviar solicitud de oferta:', error);
                }
            });
            // Evento: Unirse a un stream
            socket.on('join-stream', async (data) => {
                try {
                    const { streamId, userId, username, role } = data;
                    // Validar que el stream existe
                    const stream = await stream_model_1.default.findOne({ streamId });
                    if (!stream) {
                        socket.emit('error', { message: 'Stream no encontrado' });
                        return;
                    }
                    // Unirse a la sala del stream
                    socket.join(streamId);
                    socket.data.streamId = streamId;
                    socket.data.userId = userId;
                    socket.data.username = username;
                    socket.data.role = role;
                    // Agregar el viewer al stream
                    await stream.addViewer({
                        userId,
                        username,
                        joinedAt: new Date(),
                        socketId: socket.id,
                        isActive: true
                    });
                    // Notificar a todos en el stream
                    this.io.to(streamId).emit('viewer-joined', {
                        userId,
                        username,
                        viewerCount: stream.viewerCount
                    });
                    // Enviar mensaje de sistema al chat
                    const systemMessage = new chatMessage_model_1.default({
                        streamId,
                        userId: 'system',
                        username: 'Sistema',
                        message: `${username} se ha unido al stream`,
                        messageType: chatMessage_model_1.MessageType.SYSTEM
                    });
                    await systemMessage.save();
                    this.io.to(streamId).emit('chat-message', {
                        userId: systemMessage.userId,
                        username: systemMessage.username,
                        message: systemMessage.message,
                        messageType: systemMessage.messageType,
                        timestamp: systemMessage.timestamp
                    });
                    logger.info(`Usuario ${username} (${userId}) se unió al stream ${streamId}`);
                }
                catch (error) {
                    logger.error('Error al unirse al stream:', error);
                    socket.emit('error', { message: 'Error al unirse al stream' });
                }
            });
            // Evento: Salir de un stream
            socket.on('leave-stream', async (data) => {
                try {
                    const { streamId, userId } = data;
                    const stream = await stream_model_1.default.findOne({ streamId });
                    if (!stream)
                        return;
                    // Remover el viewer del stream
                    await stream.removeViewer(userId);
                    // Salir de la sala
                    socket.leave(streamId);
                    // Notificar a todos
                    this.io.to(streamId).emit('viewer-left', {
                        userId,
                        viewerCount: stream.viewerCount
                    });
                    logger.info(`Usuario ${userId} salió del stream ${streamId}`);
                }
                catch (error) {
                    logger.error('Error al salir del stream:', error);
                }
            });
            // Evento: Enviar mensaje al chat
            socket.on('send-message', async (data) => {
                try {
                    const { streamId, message, messageType } = data;
                    if (!socket.data.userId || !socket.data.username) {
                        socket.emit('error', { message: 'Usuario no identificado' });
                        return;
                    }
                    // Validar que el stream existe y el chat está habilitado
                    const stream = await stream_model_1.default.findOne({ streamId });
                    if (!stream) {
                        socket.emit('error', { message: 'Stream no encontrado' });
                        return;
                    }
                    if (!stream.metadata.chatEnabled) {
                        socket.emit('error', { message: 'El chat está deshabilitado' });
                        return;
                    }
                    // Guardar el mensaje
                    const chatMessage = new chatMessage_model_1.default({
                        streamId,
                        userId: socket.data.userId,
                        username: socket.data.username,
                        userRole: socket.data.role,
                        message: message.trim(),
                        messageType: messageType || chatMessage_model_1.MessageType.TEXT
                    });
                    await chatMessage.save();
                    // Emitir el mensaje a todos en el stream
                    this.io.to(streamId).emit('chat-message', {
                        userId: chatMessage.userId,
                        username: chatMessage.username,
                        userRole: chatMessage.userRole,
                        message: chatMessage.message,
                        messageType: chatMessage.messageType,
                        timestamp: chatMessage.timestamp
                    });
                    logger.info(`Mensaje en stream ${streamId} de ${socket.data.username}: ${message}`);
                }
                catch (error) {
                    logger.error('Error al enviar mensaje:', error);
                    socket.emit('error', { message: 'Error al enviar mensaje' });
                }
            });
            // Evento: WebRTC Offer (del streamer a los viewers)
            socket.on('webrtc-offer', async (data) => {
                try {
                    const { streamId, offer, targetUserId } = data;
                    if (targetUserId) {
                        // Enviar offer a un viewer específico
                        const targetSocket = await this.findSocketByUserId(streamId, targetUserId);
                        if (targetSocket) {
                            targetSocket.emit('webrtc-offer', {
                                offer,
                                from: socket.data.userId || 'unknown'
                            });
                        }
                    }
                    else {
                        // Broadcast offer a todos los viewers en el stream
                        socket.to(streamId).emit('webrtc-offer', {
                            offer,
                            from: socket.data.userId || 'unknown'
                        });
                    }
                    logger.info(`WebRTC offer enviado en stream ${streamId}`);
                }
                catch (error) {
                    logger.error('Error al enviar WebRTC offer:', error);
                }
            });
            // Evento: WebRTC Answer (de los viewers al streamer)
            socket.on('webrtc-answer', async (data) => {
                try {
                    const { streamId, answer, targetUserId } = data;
                    const targetSocket = await this.findSocketByUserId(streamId, targetUserId);
                    if (targetSocket) {
                        targetSocket.emit('webrtc-answer', {
                            answer,
                            from: socket.data.userId || 'unknown'
                        });
                    }
                    logger.info(`WebRTC answer enviado en stream ${streamId}`);
                }
                catch (error) {
                    logger.error('Error al enviar WebRTC answer:', error);
                }
            });
            // Evento: WebRTC ICE Candidate
            socket.on('webrtc-ice-candidate', async (data) => {
                try {
                    const { streamId, candidate, targetUserId } = data;
                    if (targetUserId) {
                        const targetSocket = await this.findSocketByUserId(streamId, targetUserId);
                        if (targetSocket) {
                            targetSocket.emit('webrtc-ice-candidate', {
                                candidate,
                                from: socket.data.userId || 'unknown'
                            });
                        }
                    }
                    else {
                        socket.to(streamId).emit('webrtc-ice-candidate', {
                            candidate,
                            from: socket.data.userId || 'unknown'
                        });
                    }
                }
                catch (error) {
                    logger.error('Error al enviar ICE candidate:', error);
                }
            });
            // Evento: Iniciar broadcast (solo para el streamer)
            socket.on('start-broadcast', async (data) => {
                try {
                    const { streamId } = data;
                    const stream = await stream_model_1.default.findOne({ streamId });
                    if (!stream) {
                        socket.emit('error', { message: 'Stream no encontrado' });
                        return;
                    }
                    // Verificar que el usuario es el streamer
                    if (stream.streamer.userId.toString() !== socket.data.userId) {
                        socket.emit('error', { message: 'No tienes permisos para iniciar el broadcast' });
                        return;
                    }
                    await stream.startStream();
                    // Notificar a todos que el stream comenzó
                    this.io.to(streamId).emit('stream-started', {
                        streamId,
                        startedAt: stream.startedAt
                    });
                    logger.info(`Stream ${streamId} iniciado por ${socket.data.username}`);
                }
                catch (error) {
                    logger.error('Error al iniciar broadcast:', error);
                    socket.emit('error', { message: 'Error al iniciar broadcast' });
                }
            });
            // Evento: Detener broadcast (solo para el streamer)
            socket.on('stop-broadcast', async (data) => {
                try {
                    const { streamId } = data;
                    const stream = await stream_model_1.default.findOne({ streamId });
                    if (!stream) {
                        socket.emit('error', { message: 'Stream no encontrado' });
                        return;
                    }
                    // Verificar que el usuario es el streamer
                    if (stream.streamer.userId.toString() !== socket.data.userId) {
                        socket.emit('error', { message: 'No tienes permisos para detener el broadcast' });
                        return;
                    }
                    await stream.endStream();
                    // Notificar a todos que el stream terminó
                    this.io.to(streamId).emit('stream-ended', {
                        streamId,
                        endedAt: stream.endedAt,
                        duration: stream.duration || 0
                    });
                    logger.info(`Stream ${streamId} finalizado por ${socket.data.username}`);
                }
                catch (error) {
                    logger.error('Error al detener broadcast:', error);
                    socket.emit('error', { message: 'Error al detener broadcast' });
                }
            });
            // Evento: Desconexión
            socket.on('disconnect', async () => {
                try {
                    if (socket.data.streamId && socket.data.userId) {
                        const stream = await stream_model_1.default.findOne({ streamId: socket.data.streamId });
                        if (stream) {
                            await stream.removeViewer(socket.data.userId);
                            this.io.to(socket.data.streamId).emit('viewer-left', {
                                userId: socket.data.userId,
                                viewerCount: stream.viewerCount
                            });
                        }
                    }
                    logger.info(`Cliente desconectado: ${socket.id}`);
                }
                catch (error) {
                    logger.error('Error al desconectar:', error);
                }
            });
        });
    }
    /**
     * Buscar un socket por userId en una sala específica
     */
    async findSocketByUserId(streamId, userId) {
        const sockets = await this.io.in(streamId).fetchSockets();
        const targetSocket = sockets.find(s => s.data.userId === userId);
        return targetSocket || null;
    }
    /**
     * Obtener la instancia de Socket.IO
     */
    getIO() {
        return this.io;
    }
}
exports.StreamSocketManager = StreamSocketManager;
//# sourceMappingURL=stream.socket.js.map