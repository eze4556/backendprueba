"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
const logger_1 = require("../utils/logger");
const codes_constanst_1 = require("../constants/codes.constanst");
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const logger = logger_1.Logger.getInstance('AdminAuth');
/**
 * Middleware para verificar que el usuario sea administrador
 */
const adminAuthMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Validar presencia y formato del token
        if (!authHeader) {
            logger.warn('Intento de acceso sin token');
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Token no proporcionado'
            });
        }
        if (!authHeader.toLowerCase().startsWith('bearer ')) {
            logger.warn('Token con formato incorrecto');
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Formato de token inválido'
            });
        }
        // Extraer y verificar token
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.JWT_SECRET);
        }
        catch (jwtError) {
            if (jwtError instanceof jsonwebtoken_1.default.TokenExpiredError) {
                logger.warn('Token expirado');
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.UNAUTHORIZED,
                    message: 'Token expirado'
                });
            }
            if (jwtError instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger.warn('Token inválido', { error: jwtError.message });
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.UNAUTHORIZED,
                    message: 'Token inválido'
                });
            }
            throw jwtError;
        }
        // Validar datos requeridos
        if (!decoded.id || !decoded.email || !decoded.role) {
            logger.warn('Token sin datos requeridos', { decoded });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Token con datos incompletos'
            });
        }
        // Establecer datos de usuario
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            flags: decoded.flags || {}
        };
        // Verificar rol de administrador
        if (req.user.role !== 'admin') {
            logger.warn('Intento de acceso sin privilegios de admin', {
                userId: req.user.id,
                role: req.user.role
            });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.FORBIDDEN,
                message: 'Se requieren privilegios de administrador'
            });
        }
        logger.info('Acceso de administrador autorizado', {
            userId: req.user.id,
            email: req.user.email
        });
        next();
    }
    catch (error) {
        logger.error('Error en autenticación de administrador', error);
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Error en autenticación'
        });
    }
};
exports.adminAuthMiddleware = adminAuthMiddleware;
exports.default = exports.adminAuthMiddleware;
//# sourceMappingURL=admin-auth.middleware.js.map