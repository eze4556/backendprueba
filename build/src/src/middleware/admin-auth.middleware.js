"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const codes_constanst_1 = require("../constants/codes.constanst");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Configuración del secreto JWT (idealmente debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_seguro';
/**
 * Middleware para verificar que el usuario sea administrador
 */
const adminAuthMiddleware = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token) {
            handler_helper_1.default.response(res, codes_constanst_1.UNAUTHORIZED, {
                message: 'Unauthorized',
                data: { error: 'Acceso denegado. Token no proporcionado.' }
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        // Verificar que el usuario tenga rol de administrador
        if (req.user.role !== 'admin') {
            handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                message: 'Forbidden',
                data: { error: 'Acceso denegado. Se requieren privilegios de administrador.' }
            });
            return;
        }
        next();
    }
    catch (error) {
        handler_helper_1.default.response(res, codes_constanst_1.UNAUTHORIZED, {
            message: 'Unauthorized',
            data: { error: 'Token inválido o ha expirado.' }
        });
    }
};
exports.default = adminAuthMiddleware;
