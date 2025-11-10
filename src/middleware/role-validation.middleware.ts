import { Response, NextFunction } from 'express';
import { UserRole, Permission, ROLE_PERMISSIONS, SENSITIVE_OPERATIONS, SensitiveOperationType } from '../interfaces/roles.interface';
import HttpHandler from '../helpers/handler.helper';
import { UNAUTHORIZED, FORBIDDEN } from '../constants/codes.constanst';
import { Logger } from '../utils/logger';
import * as jwt from 'jsonwebtoken';
import { load } from 'ts-dotenv';

const env = load({
  JWT_KEY: String,
});

const logger = Logger.getInstance('RoleValidation');

// Interface para usuario con información de roles
interface RoleUser {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
}

// Interface para información de roles
interface RoleInfo {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  canAccessSensitiveOperation: (operation: SensitiveOperationType) => boolean;
  level: number;
}

// Interface extendida para Request
interface RoleRequest extends Request {
  roleUser?: RoleUser;
  roleInfo?: RoleInfo;
}

// Importar Request base
import { Request } from 'express';

/**
 * Utility class para la gestión de roles y permisos
 */
export class RoleValidator {
  /**
   * Obtiene el rol del usuario desde el token JWT
   */
  static getUserRoleFromToken(token: string): UserRole | null {
    try {
      const decoded = jwt.verify(token, env.JWT_KEY) as any;
      return decoded.role || UserRole.USER; // Por defecto USER si no tiene rol
    } catch (error) {
      logger.error('Error decodificando token para obtener rol', error);
      return null;
    }
  }

  /**
   * Obtiene los permisos de un rol específico
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role]?.permissions || [];
  }

  /**
   * Verifica si un rol tiene un permiso específico
   */
  static roleHasPermission(role: UserRole, permission: Permission): boolean {
    const roleConfig = ROLE_PERMISSIONS[role];
    if (!roleConfig) return false;
    return roleConfig.permissions.includes(permission);
  }

  /**
   * Verifica si un rol puede acceder a una operación sensible
   */
  static canAccessSensitiveOperation(role: UserRole, operation: SensitiveOperationType): boolean {
    const requiredPermissions = SENSITIVE_OPERATIONS[operation];
    const userPermissions = this.getPermissionsForRole(role);
    
    // Debe tener al menos uno de los permisos requeridos
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Obtiene el nivel de autoridad de un rol
   */
  static getRoleLevel(role: UserRole): number {
    return ROLE_PERMISSIONS[role]?.level || 0;
  }

  /**
   * Verifica si un rol es superior a otro
   */
  static isRoleHigher(role1: UserRole, role2: UserRole): boolean {
    return this.getRoleLevel(role1) > this.getRoleLevel(role2);
  }
}

/**
 * Middleware para verificar autenticación y extraer información de roles
 */
export const extractRoleInfo = (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return HttpHandler.error(res, {
        code: UNAUTHORIZED,
        message: 'Token de autorización requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return HttpHandler.error(res, {
        code: UNAUTHORIZED,
        message: 'Formato de token inválido'
      });
    }

    const decoded = jwt.verify(token, env.JWT_KEY) as any;
    const userRole = decoded.role || UserRole.USER;
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
      hasPermission: (permission: Permission) => 
        RoleValidator.roleHasPermission(userRole, permission),
      
      hasAnyPermission: (permissions: Permission[]) => 
        permissions.some(p => RoleValidator.roleHasPermission(userRole, p)),
      
      hasRole: (role: UserRole) => userRole === role,
      
      hasAnyRole: (roles: UserRole[]) => roles.includes(userRole),
      
      canAccessSensitiveOperation: (operation: SensitiveOperationType) => 
        RoleValidator.canAccessSensitiveOperation(userRole, operation),
      
      level: RoleValidator.getRoleLevel(userRole)
    };

    // Verificar si el usuario está activo
    if (!req.roleUser.isActive) {
      logger.warn('Usuario inactivo intentando acceder', {
        userId: req.roleUser._id,
        email: req.roleUser.email
      });
      return HttpHandler.error(res, {
        code: FORBIDDEN,
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
  } catch (error) {
    logger.error('Error en extracción de información de roles', error);
    return HttpHandler.error(res, {
      code: UNAUTHORIZED,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware para requerir permisos específicos
 */
export const requirePermissions = (...permissions: Permission[]) => {
  return (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.roleInfo) {
      return HttpHandler.error(res, {
        code: UNAUTHORIZED,
        message: 'Información de roles no disponible'
      });
    }

    const hasPermission = req.roleInfo.hasAnyPermission(permissions);
    
    if (!hasPermission) {
      logger.warn('Acceso denegado por falta de permisos', {
        userId: req.roleUser?._id,
        userRole: req.roleUser?.role,
        requiredPermissions: permissions,
        userPermissions: req.roleUser?.permissions
      });
      
      return HttpHandler.error(res, {
        code: FORBIDDEN,
        message: 'Permisos insuficientes para esta operación',
        errors: [{
          requiredPermissions: permissions,
          userRole: req.roleUser?.role,
          userLevel: req.roleInfo.level
        }]
      });
    }

    next();
  };
};

/**
 * Middleware para requerir roles específicos
 */
export const requireRoles = (...roles: UserRole[]) => {
  return (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.roleInfo) {
      return HttpHandler.error(res, {
        code: UNAUTHORIZED,
        message: 'Información de roles no disponible'
      });
    }

    const hasRole = req.roleInfo.hasAnyRole(roles);
    
    if (!hasRole) {
      logger.warn('Acceso denegado por rol insuficiente', {
        userId: req.roleUser?._id,
        userRole: req.roleUser?.role,
        requiredRoles: roles
      });
      
      return HttpHandler.error(res, {
        code: FORBIDDEN,
        message: 'Rol insuficiente para esta operación',
        errors: [{
          requiredRoles: roles,
          userRole: req.roleUser?.role,
          userLevel: req.roleInfo.level
        }]
      });
    }

    next();
  };
};

/**
 * Middleware para operaciones sensibles
 */
export const requireSensitiveOperation = (operation: SensitiveOperationType) => {
  return (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.roleInfo) {
      return HttpHandler.error(res, {
        code: UNAUTHORIZED,
        message: 'Información de roles no disponible'
      });
    }

    const canAccess = req.roleInfo.canAccessSensitiveOperation(operation);
    
    if (!canAccess) {
      logger.warn('Acceso denegado a operación sensible', {
        userId: req.roleUser?._id,
        userRole: req.roleUser?.role,
        operation: operation,
        userLevel: req.roleInfo.level
      });
      
      return HttpHandler.error(res, {
        code: FORBIDDEN,
        message: `Acceso denegado a operación sensible: ${operation}`,
        errors: [{
          operation: operation,
          userRole: req.roleUser?.role,
          userLevel: req.roleInfo.level,
          requiredPermissions: SENSITIVE_OPERATIONS[operation]
        }]
      });
    }

    next();
  };
};

/**
 * Middleware para solo administradores
 */
export const adminOnly = (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
  return requireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN)(req, res, next);
};

/**
 * Middleware para roles con permisos de modificación
 */
export const canModify = (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
  return requireRoles(
    UserRole.ADMIN, 
    UserRole.SUPER_ADMIN, 
    UserRole.PROFESSIONAL, 
    UserRole.PROVIDER,
    UserRole.MODERATOR
  )(req, res, next);
};

/**
 * Middleware para roles con permisos financieros
 */
export const canAccessFinancial = (req: RoleRequest, res: Response, next: NextFunction): Response | void => {
  return requireSensitiveOperation('FINANCIAL_CRITICAL')(req, res, next);
};

/**
 * Middleware combinado: autenticación + extracción de roles
 */
export const authenticateAndExtractRoles = [extractRoleInfo];

// Exportaciones de conveniencia
export {
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  SENSITIVE_OPERATIONS
};

export default {
  extractRoleInfo,
  requirePermissions,
  requireRoles,
  requireSensitiveOperation,
  adminOnly,
  canModify,
  canAccessFinancial,
  authenticateAndExtractRoles,
  RoleValidator
};