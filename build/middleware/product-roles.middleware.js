"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.canReadProducts = exports.canModifyProducts = void 0;
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const codes_constanst_1 = require("../constants/codes.constanst");
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getInstance('RoleAuth');
/**
 * Middleware para verificar que el usuario tenga permisos de modificación de productos
 * Roles permitidos: admin, professional, provider
 */
const canModifyProducts = (req, res, next) => {
    var _a;
    if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !req.user) {
        logger.warn('Intento de acceso sin autenticación');
        handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
        return;
    }
    // Permitir acceso a admin, proveedor o profesional
    if (!req.auth.isAdmin && !req.auth.isProvider && !req.auth.isProfessional) {
        logger.warn('Usuario sin privilegios intentando modificar productos', {
            userId: req.user.id,
            role: req.user.role,
            flags: req.user.flags
        });
        handler_helper_1.default.error(res, {
            code: codes_constanst_1.FORBIDDEN,
            message: 'Se requieren privilegios especiales para modificar productos',
            errors: [{
                    userRole: req.user.role,
                    flags: req.user.flags,
                    requiredRoles: ['admin', 'professional', 'provider']
                }]
        });
        return;
    }
    next();
};
exports.canModifyProducts = canModifyProducts;
/**
 * Middleware para operaciones de solo lectura
 * Cualquier usuario autenticado puede leer
 */
const canReadProducts = (req, res, next) => {
    var _a;
    if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !req.user) {
        logger.warn('Intento de acceso sin autenticación');
        handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
        return;
    }
    // Cualquier usuario autenticado puede leer productos
    next();
};
exports.canReadProducts = canReadProducts;
/**
 * Middleware solo para administradores
 */
const adminOnly = (req, res, next) => {
    var _a;
    if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.isAuthenticated) || !req.user) {
        logger.warn('Intento de acceso sin autenticación');
        handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
        return;
    }
    if (!req.auth.isAdmin) {
        logger.warn('Usuario sin privilegios de administrador intentando acceder', {
            userId: req.user.id,
            role: req.user.role
        });
        handler_helper_1.default.error(res, {
            code: codes_constanst_1.FORBIDDEN,
            message: 'Acceso denegado. Se requiere rol de administrador.',
            errors: [{
                    userRole: req.user.role,
                    requiredRole: 'admin'
                }]
        });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=product-roles.middleware.js.map