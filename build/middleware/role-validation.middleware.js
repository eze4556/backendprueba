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
exports.SENSITIVE_OPERATIONS = exports.ROLE_PERMISSIONS = exports.Permission = exports.UserRole = exports.authenticateAndExtractRoles = exports.canAccessFinancial = exports.canModify = exports.adminOnly = exports.requireSensitiveOperation = exports.requireRoles = exports.requirePermissions = exports.extractRoleInfo = exports.RoleValidator = void 0;
const roles_interface_1 = require("../interfaces/roles.interface");
Object.defineProperty(exports, "UserRole", { enumerable: true, get: function () { return roles_interface_1.UserRole; } });
Object.defineProperty(exports, "Permission", { enumerable: true, get: function () { return roles_interface_1.Permission; } });
Object.defineProperty(exports, "ROLE_PERMISSIONS", { enumerable: true, get: function () { return roles_interface_1.ROLE_PERMISSIONS; } });
Object.defineProperty(exports, "SENSITIVE_OPERATIONS", { enumerable: true, get: function () { return roles_interface_1.SENSITIVE_OPERATIONS; } });
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const codes_constanst_1 = require("../constants/codes.constanst");
const logger_1 = require("../utils/logger");
const jwt = __importStar(require("jsonwebtoken"));
const ts_dotenv_1 = require("ts-dotenv");
const env = (0, ts_dotenv_1.load)({
    JWT_KEY: String,
});
const logger = logger_1.Logger.getInstance('RoleValidation');
/**
 * Utility class para la gestión de roles y permisos
 */
class RoleValidator {
    /**
     * Obtiene el rol del usuario desde el token JWT
     */
    static getUserRoleFromToken(token) {
        try {
            const decoded = jwt.verify(token, env.JWT_KEY);
            return decoded.role || roles_interface_1.UserRole.USER; // Por defecto USER si no tiene rol
        }
        catch (error) {
            logger.error('Error decodificando token para obtener rol', error);
            return null;
        }
    }
    /**
     * Obtiene los permisos de un rol específico
     */
    static getPermissionsForRole(role) {
        var _a;
        return ((_a = roles_interface_1.ROLE_PERMISSIONS[role]) === null || _a === void 0 ? void 0 : _a.permissions) || [];
    }
    /**
     * Verifica si un rol tiene un permiso específico
     */
    static roleHasPermission(role, permission) {
        const roleConfig = roles_interface_1.ROLE_PERMISSIONS[role];
        if (!roleConfig)
            return false;
        return roleConfig.permissions.includes(permission);
    }
    /**
     * Verifica si un rol puede acceder a una operación sensible
     */
    static canAccessSensitiveOperation(role, operation) {
        const requiredPermissions = roles_interface_1.SENSITIVE_OPERATIONS[operation];
        const userPermissions = this.getPermissionsForRole(role);
        // Debe tener al menos uno de los permisos requeridos
        return requiredPermissions.some(permission => userPermissions.includes(permission));
    }
    /**
     * Obtiene el nivel de autoridad de un rol
     */
    static getRoleLevel(role) {
        var _a;
        return ((_a = roles_interface_1.ROLE_PERMISSIONS[role]) === null || _a === void 0 ? void 0 : _a.level) || 0;
    }
    /**
     * Verifica si un rol es superior a otro
     */
    static isRoleHigher(role1, role2) {
        return this.getRoleLevel(role1) > this.getRoleLevel(role2);
    }
}
exports.RoleValidator = RoleValidator;
/**
 * Middleware para verificar autenticación y extraer información de roles
 */
const extractRoleInfo = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Token de autorización requerido'
            });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Formato de token inválido'
            });
        }
        const decoded = jwt.verify(token, env.JWT_KEY);
        const userRole = decoded.role || roles_interface_1.UserRole.USER;
        const permissions = RoleValidator.getPermissionsForRole(userRole);
        // Configurar información del usuario
        req.roleUser = {
            _id: decoded._id,
            email: decoded.email,
            name: decoded.name,
            role: userRole,
            permissions: permissions,
            isActive: decoded.isActive !== false
        };
        // Configurar utilidades de roles
        req.roleInfo = {
            hasPermission: (permission) => RoleValidator.roleHasPermission(userRole, permission),
            hasAnyPermission: (permissions) => permissions.some(p => RoleValidator.roleHasPermission(userRole, p)),
            hasRole: (role) => userRole === role,
            hasAnyRole: (roles) => roles.includes(userRole),
            canAccessSensitiveOperation: (operation) => RoleValidator.canAccessSensitiveOperation(userRole, operation),
            level: RoleValidator.getRoleLevel(userRole)
        };
        // Verificar si el usuario está activo
        if (!req.roleUser.isActive) {
            logger.warn('Usuario inactivo intentando acceder', {
                userId: req.roleUser._id,
                email: req.roleUser.email
            });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.FORBIDDEN,
                message: 'Usuario inactivo. Contacta al administrador.'
            });
        }
        logger.info('Usuario autenticado con éxito', {
            userId: req.roleUser._id,
            email: req.roleUser.email,
            role: userRole,
            level: req.roleInfo.level
        });
        next();
    }
    catch (error) {
        logger.error('Error en extracción de información de roles', error);
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.UNAUTHORIZED,
            message: 'Token inválido'
        });
    }
};
exports.extractRoleInfo = extractRoleInfo;
/**
 * Middleware para requerir permisos específicos
 */
const requirePermissions = (...permissions) => {
    return (req, res, next) => {
        var _a, _b, _c, _d;
        if (!req.roleInfo) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Información de roles no disponible'
            });
        }
        const hasPermission = req.roleInfo.hasAnyPermission(permissions);
        if (!hasPermission) {
            logger.warn('Acceso denegado por falta de permisos', {
                userId: (_a = req.roleUser) === null || _a === void 0 ? void 0 : _a._id,
                userRole: (_b = req.roleUser) === null || _b === void 0 ? void 0 : _b.role,
                requiredPermissions: permissions,
                userPermissions: (_c = req.roleUser) === null || _c === void 0 ? void 0 : _c.permissions
            });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.FORBIDDEN,
                message: 'Permisos insuficientes para esta operación',
                errors: [{
                        requiredPermissions: permissions,
                        userRole: (_d = req.roleUser) === null || _d === void 0 ? void 0 : _d.role,
                        userLevel: req.roleInfo.level
                    }]
            });
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
/**
 * Middleware para requerir roles específicos
 */
const requireRoles = (...roles) => {
    return (req, res, next) => {
        var _a, _b, _c;
        if (!req.roleInfo) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Información de roles no disponible'
            });
        }
        const hasRole = req.roleInfo.hasAnyRole(roles);
        if (!hasRole) {
            logger.warn('Acceso denegado por rol insuficiente', {
                userId: (_a = req.roleUser) === null || _a === void 0 ? void 0 : _a._id,
                userRole: (_b = req.roleUser) === null || _b === void 0 ? void 0 : _b.role,
                requiredRoles: roles
            });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.FORBIDDEN,
                message: 'Rol insuficiente para esta operación',
                errors: [{
                        requiredRoles: roles,
                        userRole: (_c = req.roleUser) === null || _c === void 0 ? void 0 : _c.role,
                        userLevel: req.roleInfo.level
                    }]
            });
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Middleware para operaciones sensibles
 */
const requireSensitiveOperation = (operation) => {
    return (req, res, next) => {
        var _a, _b, _c;
        if (!req.roleInfo) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Información de roles no disponible'
            });
        }
        const canAccess = req.roleInfo.canAccessSensitiveOperation(operation);
        if (!canAccess) {
            logger.warn('Acceso denegado a operación sensible', {
                userId: (_a = req.roleUser) === null || _a === void 0 ? void 0 : _a._id,
                userRole: (_b = req.roleUser) === null || _b === void 0 ? void 0 : _b.role,
                operation: operation,
                userLevel: req.roleInfo.level
            });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.FORBIDDEN,
                message: `Acceso denegado a operación sensible: ${operation}`,
                errors: [{
                        operation: operation,
                        userRole: (_c = req.roleUser) === null || _c === void 0 ? void 0 : _c.role,
                        userLevel: req.roleInfo.level,
                        requiredPermissions: roles_interface_1.SENSITIVE_OPERATIONS[operation]
                    }]
            });
        }
        next();
    };
};
exports.requireSensitiveOperation = requireSensitiveOperation;
/**
 * Middleware para solo administradores
 */
const adminOnly = (req, res, next) => {
    return (0, exports.requireRoles)(roles_interface_1.UserRole.ADMIN, roles_interface_1.UserRole.SUPER_ADMIN)(req, res, next);
};
exports.adminOnly = adminOnly;
/**
 * Middleware para roles con permisos de modificación
 */
const canModify = (req, res, next) => {
    return (0, exports.requireRoles)(roles_interface_1.UserRole.ADMIN, roles_interface_1.UserRole.SUPER_ADMIN, roles_interface_1.UserRole.PROFESSIONAL, roles_interface_1.UserRole.PROVIDER, roles_interface_1.UserRole.MODERATOR)(req, res, next);
};
exports.canModify = canModify;
/**
 * Middleware para roles con permisos financieros
 */
const canAccessFinancial = (req, res, next) => {
    return (0, exports.requireSensitiveOperation)('FINANCIAL_CRITICAL')(req, res, next);
};
exports.canAccessFinancial = canAccessFinancial;
/**
 * Middleware combinado: autenticación + extracción de roles
 */
exports.authenticateAndExtractRoles = [exports.extractRoleInfo];
exports.default = {
    extractRoleInfo: exports.extractRoleInfo,
    requirePermissions: exports.requirePermissions,
    requireRoles: exports.requireRoles,
    requireSensitiveOperation: exports.requireSensitiveOperation,
    adminOnly: exports.adminOnly,
    canModify: exports.canModify,
    canAccessFinancial: exports.canAccessFinancial,
    authenticateAndExtractRoles: exports.authenticateAndExtractRoles,
    RoleValidator
};
//# sourceMappingURL=role-validation.middleware.js.map