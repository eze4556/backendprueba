"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
const logger_1 = require("../utils/logger");
const codes_constanst_1 = require("../constants/codes.constanst");
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const logger = logger_1.Logger.getInstance('Auth');
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // Validar presencia y formato del token
        if (!authHeader) {
            logger.warn('Intento de acceso sin token', {
                ip: req.ip,
                path: req.path,
                userId: 'anonymous',
                timestamp: new Date().toISOString(),
                type: 'MISSING_TOKEN'
            });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Token no proporcionado'
            });
        }
        if (!authHeader.toLowerCase().startsWith('bearer ')) {
            logger.warn('Token con formato incorrecto', {
                ip: req.ip,
                path: req.path,
                userId: 'anonymous',
                timestamp: new Date().toISOString(),
                type: 'INVALID_TOKEN_FORMAT'
            });
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
                logger.warn('Token expirado', {
                    ip: req.ip,
                    path: req.path,
                    userId: 'anonymous',
                    timestamp: new Date().toISOString(),
                    type: 'EXPIRED_TOKEN'
                });
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.UNAUTHORIZED,
                    message: 'Token expirado'
                });
            }
            if (jwtError instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                logger.warn('Token inválido', {
                    error: jwtError.message,
                    ip: req.ip,
                    path: req.path,
                    userId: 'anonymous',
                    timestamp: new Date().toISOString(),
                    type: 'INVALID_TOKEN'
                });
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
            return;
        }
        // Establecer datos de usuario y flags de autorización
        const flags = decoded.flags || {
            isProvider: false,
            isProfessional: false
        };
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            flags: flags
        };
        req.auth = {
            isAuthenticated: true,
            isAdmin: decoded.role === 'admin' || decoded.role === 'super_admin',
            isProvider: flags.isProvider === true,
            isProfessional: flags.isProfessional === true
        };
        logger.info('Usuario autenticado correctamente', {
            userId: req.user.id,
            role: req.user.role,
            flags: flags
        });
        next();
    }
    catch (error) {
        logger.error('Error en autenticación', error);
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Error en autenticación'
        });
    }
}; /**
 * Middleware para verificar que el usuario sea administrador
 */
exports.authMiddleware = authMiddleware;
const adminAuthMiddleware = (req, res, next) => {
    var _a;
    // Verificar autenticación primero
    if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !req.user) {
        logger.warn('Intento de acceso sin autenticación a ruta de admin');
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
    }
    // Verificar rol de administrador
    if (!req.auth.isAdmin) {
        logger.warn('Usuario sin privilegios intentando acceder a ruta de admin', {
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
        role: req.user.role
    });
    next();
};
exports.adminAuthMiddleware = adminAuthMiddleware;
//# sourceMappingURL=auth.middleware.js.map