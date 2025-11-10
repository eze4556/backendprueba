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
exports.StreamController = void 0;
const stream_model_1 = __importStar(require("../models/stream.model"));
const crypto_1 = __importDefault(require("crypto"));
// Función para generar UUID v4 sin dependencia externa
function generateUUID() {
    return crypto_1.default.randomUUID();
}
class StreamController {
    /**
     * Crear una nueva sesión de streaming
     */
    static async createStream(req, res) {
        try {
            const { title, description, quality, isPrivate, allowedViewers, tags, category, role, product, productType, productStatus, location } = req.body;
            if (!req.user || typeof req.user === 'string') {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            // Validaciones
            if (!title || title.trim().length === 0) {
                return res.status(400).json({ error: 'El título es requerido' });
            }
            // Obtener información del usuario del token JWT
            const userId = req.user._id || req.user.id;
            const username = req.user.username || req.user.nombre || req.user.name || req.user.email;
            const userRole = req.user.role || req.user.type || 'user';
            // Doble verificación de permisos
            const blockedRoles = ['user', 'usuarios', 'cliente'];
            if (blockedRoles.includes(userRole.toLowerCase())) {
                return res.status(403).json({
                    error: 'Los usuarios comunes no tienen permisos para crear transmisiones',
                    message: 'Solo profesionales, proveedores, vendedores y otros roles de negocio pueden transmitir'
                });
            }
            // Verificar si el usuario ya tiene un stream activo
            const activeStream = await stream_model_1.default.findOne({
                'streamer.userId': userId,
                status: { $in: [stream_model_1.StreamStatus.WAITING, stream_model_1.StreamStatus.LIVE] }
            });
            if (activeStream) {
                return res.status(400).json({
                    error: 'Ya tienes una transmisión activa',
                    streamId: activeStream.streamId
                });
            }
            // Generar IDs únicos
            const streamId = `stream_${generateUUID()}`;
            const roomId = `room_${generateUUID()}`;
            // Crear el stream
            const newStream = new stream_model_1.default({
                streamId,
                title: title.trim(),
                description: (description === null || description === void 0 ? void 0 : description.trim()) || '',
                streamer: {
                    userId: userId,
                    username: username,
                    role: userRole
                },
                status: stream_model_1.StreamStatus.WAITING,
                quality: quality || stream_model_1.StreamQuality.MEDIUM,
                isPrivate: isPrivate || false,
                allowedViewers: allowedViewers || [],
                tags: tags || [],
                category: category || 'general',
                role: role || '',
                product: product || '',
                productType: productType || '',
                productStatus: productStatus || '',
                location: location || '',
                webrtc: {
                    roomId
                },
                metadata: {
                    totalViews: 0,
                    peakViewers: 0,
                    averageViewTime: 0,
                    chatEnabled: true,
                    recordingEnabled: false
                }
            });
            await newStream.save();
            return res.status(201).json({
                success: true,
                message: 'Stream creado exitosamente',
                stream: {
                    streamId: newStream.streamId,
                    roomId: newStream.webrtc.roomId,
                    title: newStream.title,
                    description: newStream.description,
                    status: newStream.status,
                    quality: newStream.quality,
                    isPrivate: newStream.isPrivate,
                    category: newStream.category,
                    createdAt: newStream.createdAt
                }
            });
        }
        catch (error) {
            console.error('Error creating stream:', error);
            return res.status(500).json({
                error: 'Error al crear el stream',
                details: error.message
            });
        }
    }
    /**
     * Iniciar el streaming (cambiar estado a LIVE)
     */
    static async startStream(req, res) {
        try {
            const { streamId } = req.params;
            if (!req.user || typeof req.user === 'string') {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            const userId = req.user._id || req.user.id;
            const stream = await stream_model_1.default.findOne({ streamId });
            if (!stream) {
                return res.status(404).json({ error: 'Stream no encontrado' });
            }
            // Verificar que el usuario sea el dueño del stream
            if (stream.streamer.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'No tienes permisos para iniciar este stream' });
            }
            // Iniciar el stream
            await stream.startStream();
            return res.status(200).json({
                success: true,
                message: 'Stream iniciado',
                stream: {
                    streamId: stream.streamId,
                    status: stream.status,
                    startedAt: stream.startedAt
                }
            });
        }
        catch (error) {
            console.error('Error starting stream:', error);
            return res.status(500).json({
                error: 'Error al iniciar el stream',
                details: error.message
            });
        }
    }
    /**
     * Finalizar el streaming
     */
    static async endStream(req, res) {
        try {
            const { streamId } = req.params;
            if (!req.user || typeof req.user === 'string') {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            const userId = req.user._id || req.user.id;
            const stream = await stream_model_1.default.findOne({ streamId });
            if (!stream) {
                return res.status(404).json({ error: 'Stream no encontrado' });
            }
            // Verificar que el usuario sea el dueño del stream
            if (stream.streamer.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'No tienes permisos para finalizar este stream' });
            }
            // Finalizar el stream
            await stream.endStream();
            return res.status(200).json({
                success: true,
                message: 'Stream finalizado',
                stream: {
                    streamId: stream.streamId,
                    status: stream.status,
                    duration: stream.duration,
                    viewerCount: stream.viewerCount,
                    peakViewers: stream.metadata.peakViewers,
                    totalViews: stream.metadata.totalViews
                }
            });
        }
        catch (error) {
            console.error('Error ending stream:', error);
            return res.status(500).json({
                error: 'Error al finalizar el stream',
                details: error.message
            });
        }
    }
    /**
     * Obtener información de un stream específico
     */
    static async getStream(req, res) {
        try {
            const { streamId } = req.params;
            const stream = await stream_model_1.default.findOne({ streamId });
            if (!stream) {
                return res.status(404).json({ error: 'Stream no encontrado' });
            }
            return res.status(200).json({
                success: true,
                stream: {
                    streamId: stream.streamId,
                    title: stream.title,
                    description: stream.description,
                    streamer: stream.streamer,
                    status: stream.status,
                    quality: stream.quality,
                    viewerCount: stream.viewerCount,
                    isPrivate: stream.isPrivate,
                    tags: stream.tags,
                    category: stream.category,
                    startedAt: stream.startedAt,
                    metadata: stream.metadata,
                    createdAt: stream.createdAt
                }
            });
        }
        catch (error) {
            console.error('Error getting stream:', error);
            return res.status(500).json({
                error: 'Error al obtener el stream',
                details: error.message
            });
        }
    }
    /**
     * Listar streams activos (en vivo)
     */
    static async getActiveStreams(req, res) {
        try {
            const { category, role, product, productType, productStatus, location, limit = 20, page = 1 } = req.query;
            const query = { status: stream_model_1.StreamStatus.LIVE };
            if (category) {
                query.category = category;
            }
            if (role) {
                query.role = role;
            }
            if (product) {
                query.product = product;
            }
            if (productType) {
                query.productType = productType;
            }
            if (productStatus) {
                query.productStatus = productStatus;
            }
            if (location) {
                query.location = location;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const streams = await stream_model_1.default.find(query)
                .sort({ viewerCount: -1, createdAt: -1 })
                .limit(Number(limit))
                .skip(skip)
                .select('-viewers -webrtc.signalData');
            const total = await stream_model_1.default.countDocuments(query);
            return res.status(200).json({
                success: true,
                streams: streams.map(stream => ({
                    streamId: stream.streamId,
                    title: stream.title,
                    description: stream.description,
                    streamer: stream.streamer,
                    viewerCount: stream.viewerCount,
                    quality: stream.quality,
                    tags: stream.tags,
                    category: stream.category,
                    role: stream.role,
                    product: stream.product,
                    productType: stream.productType,
                    productStatus: stream.productStatus,
                    thumbnailUrl: stream.thumbnailUrl,
                    startedAt: stream.startedAt
                })),
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Error getting active streams:', error);
            return res.status(500).json({
                error: 'Error al obtener los streams activos',
                details: error.message
            });
        }
    }
    /**
     * Obtener streams del usuario actual
     */
    static async getMyStreams(req, res) {
        try {
            if (!req.user || typeof req.user === 'string') {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            const userId = req.user._id || req.user.id;
            const { status, limit = 10, page = 1 } = req.query;
            const query = { 'streamer.userId': userId };
            if (status) {
                query.status = status;
            }
            const skip = (Number(page) - 1) * Number(limit);
            const streams = await stream_model_1.default.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip(skip);
            const total = await stream_model_1.default.countDocuments(query);
            return res.status(200).json({
                success: true,
                streams: streams.map(stream => ({
                    streamId: stream.streamId,
                    title: stream.title,
                    status: stream.status,
                    viewerCount: stream.viewerCount,
                    peakViewers: stream.metadata.peakViewers,
                    totalViews: stream.metadata.totalViews,
                    duration: stream.duration,
                    startedAt: stream.startedAt,
                    endedAt: stream.endedAt,
                    createdAt: stream.createdAt
                })),
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Error getting my streams:', error);
            return res.status(500).json({
                error: 'Error al obtener tus streams',
                details: error.message
            });
        }
    }
    /**
     * Unirse a un stream como espectador (validación de acceso)
     */
    static async joinStream(req, res) {
        var _a;
        try {
            const { streamId } = req.params;
            if (!req.user || typeof req.user === 'string') {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            const userId = req.user._id || req.user.id;
            const stream = await stream_model_1.default.findOne({ streamId });
            if (!stream) {
                return res.status(404).json({ error: 'Stream no encontrado' });
            }
            // Verificar si el stream está en vivo
            if (stream.status !== stream_model_1.StreamStatus.LIVE) {
                return res.status(400).json({
                    error: 'El stream no está en vivo',
                    status: stream.status
                });
            }
            // Verificar si es privado y el usuario tiene acceso
            if (stream.isPrivate) {
                const isAllowed = ((_a = stream.allowedViewers) === null || _a === void 0 ? void 0 : _a.includes(userId.toString())) ||
                    stream.streamer.userId.toString() === userId.toString();
                if (!isAllowed) {
                    return res.status(403).json({ error: 'No tienes acceso a este stream privado' });
                }
            }
            // Verificar límite de espectadores
            if (stream.viewerCount >= stream.maxViewers) {
                return res.status(429).json({ error: 'El stream ha alcanzado el límite de espectadores' });
            }
            return res.status(200).json({
                success: true,
                message: 'Acceso concedido al stream',
                stream: {
                    streamId: stream.streamId,
                    roomId: stream.webrtc.roomId,
                    title: stream.title,
                    streamer: stream.streamer,
                    quality: stream.quality,
                    chatEnabled: stream.metadata.chatEnabled
                }
            });
        }
        catch (error) {
            console.error('Error joining stream:', error);
            return res.status(500).json({
                error: 'Error al unirse al stream',
                details: error.message
            });
        }
    }
    /**
     * Actualizar configuración del stream
     */
    static async updateStream(req, res) {
        try {
            const { streamId } = req.params;
            const { title, description, quality, chatEnabled } = req.body;
            if (!req.user || typeof req.user === 'string') {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }
            const userId = req.user._id || req.user.id;
            const stream = await stream_model_1.default.findOne({ streamId });
            if (!stream) {
                return res.status(404).json({ error: 'Stream no encontrado' });
            }
            // Verificar que el usuario sea el dueño del stream
            if (stream.streamer.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'No tienes permisos para modificar este stream' });
            }
            // Actualizar campos
            if (title)
                stream.title = title.trim();
            if (description !== undefined)
                stream.description = description.trim();
            if (quality)
                stream.quality = quality;
            if (chatEnabled !== undefined)
                stream.metadata.chatEnabled = chatEnabled;
            await stream.save();
            return res.status(200).json({
                success: true,
                message: 'Stream actualizado',
                stream: {
                    streamId: stream.streamId,
                    title: stream.title,
                    description: stream.description,
                    quality: stream.quality,
                    chatEnabled: stream.metadata.chatEnabled
                }
            });
        }
        catch (error) {
            console.error('Error updating stream:', error);
            return res.status(500).json({
                error: 'Error al actualizar el stream',
                details: error.message
            });
        }
    }
}
exports.StreamController = StreamController;
//# sourceMappingURL=stream.controller.js.map