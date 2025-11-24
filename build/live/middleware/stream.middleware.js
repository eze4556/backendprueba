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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStreamData = exports.streamLimitMiddleware = exports.streamPermissionMiddleware = void 0;
/**
 * Middleware para verificar que el usuario tenga permisos de streaming
 * Todos los roles pueden transmitir EXCEPTO: user (usuarios comunes)
 */
const streamPermissionMiddleware = (req, res, next) => {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
    }
    // Obtener el rol del usuario (puede estar en role, type, o primary_data.type)
    const userRole = (req.user.role || req.user.type || '').toLowerCase();
    // Roles NO permitidos para transmitir (solo usuarios comunes están excluidos)
    const blockedRoles = ['user', 'usuarios', 'cliente'];
    // Permitir super_admin expl�citamente
    if (userRole === 'super_admin' || userRole === 'admin') {
        next();
        return;
    }
    if (!userRole || blockedRoles.includes(userRole)) {
        res.status(403).json({
            error: 'Los usuarios comunes no tienen permisos para transmitir en vivo',
            message: 'Solo profesionales, proveedores, vendedores y otros roles de negocio pueden crear transmisiones',
            allowedRoles: ['admin', 'professional', 'autonomous', 'dedicated', 'provider', 'seller', 'moderator']
        });
        return;
    }
    next();
};
exports.streamPermissionMiddleware = streamPermissionMiddleware;
/**
 * Middleware para verificar límites de streaming del usuario
 */
const streamLimitMiddleware = async (req, res, next) => {
    if (!req.user || typeof req.user === 'string') {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
    }
    try {
        // Importar aquí para evitar dependencias circulares
        const Stream = (await Promise.resolve().then(() => __importStar(require('../models/stream.model')))).default;
        const { StreamStatus } = await Promise.resolve().then(() => __importStar(require('../models/stream.model')));
        // Verificar si el usuario ya tiene streams activos
        const activeStreamsCount = await Stream.countDocuments({
            'streamer.userId': req.user._id,
            status: { $in: [StreamStatus.WAITING, StreamStatus.LIVE] }
        });
        // Límite de streams simultáneos por usuario
        const maxSimultaneousStreams = 1;
        if (activeStreamsCount >= maxSimultaneousStreams) {
            res.status(429).json({
                error: `Ya tienes ${activeStreamsCount} stream(s) activo(s)`,
                limit: maxSimultaneousStreams
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({
            error: 'Error al verificar límites de streaming',
            details: error.message
        });
    }
};
exports.streamLimitMiddleware = streamLimitMiddleware;
/**
 * Middleware para validar datos del stream
 */
const validateStreamData = (req, res, next) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'El título del stream es requerido' });
        return;
    }
    if (title.length > 200) {
        res.status(400).json({ error: 'El título no puede exceder 200 caracteres' });
        return;
    }
    const { description } = req.body;
    if (description && description.length > 1000) {
        res.status(400).json({ error: 'La descripción no puede exceder 1000 caracteres' });
        return;
    }
    next();
};
exports.validateStreamData = validateStreamData;
//# sourceMappingURL=stream.middleware.js.map