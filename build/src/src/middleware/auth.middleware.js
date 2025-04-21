"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Configuración del secreto JWT (idealmente debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_seguro';
/**
 * Middleware para verificar que el usuario esté autenticado
 */
const authMiddleware = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Token inválido.' });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Middleware para verificar que el usuario sea administrador
 */
const adminAuthMiddleware = (req, res, next) => {
    // Primero verificamos que esté autenticado
    (0, exports.authMiddleware)(req, res, (err) => {
        // Si hay error o no hay respuesta del middleware de autenticación
        if (err) {
            return next(err);
        }
        // Si el usuario no está definido (podría pasar en casos extraños)
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado.' });
        }
        // Luego verificamos que sea administrador
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de administrador.' });
        }
        // Todo está bien, el usuario es administrador
        next();
    });
};
exports.adminAuthMiddleware = adminAuthMiddleware;
