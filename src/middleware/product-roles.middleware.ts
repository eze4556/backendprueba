import { Response, NextFunction } from 'express';
import HttpHandler from '../helpers/handler.helper';
import { UNAUTHORIZED, FORBIDDEN } from '../constants/codes.constanst';
import { Logger } from '../utils/logger';
import { AuthRequest } from '../interfaces/auth.interface';

const logger = Logger.getInstance('RoleAuth');

/**
 * Middleware para verificar que el usuario tenga permisos de modificación de productos
 * Roles permitidos: admin, professional, provider
 */
export const canModifyProducts = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth?.isAuthenticated || !req.user) {
        logger.warn('Intento de acceso sin autenticación');
        HttpHandler.error(res, {
            code: UNAUTHORIZED,
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
        HttpHandler.error(res, {
            code: FORBIDDEN,
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

/**
 * Middleware para operaciones de solo lectura
 * Cualquier usuario autenticado puede leer
 */
export const canReadProducts = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth?.isAuthenticated || !req.user) {
        logger.warn('Intento de acceso sin autenticación');
        HttpHandler.error(res, {
            code: UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
        return;
    }

    // Cualquier usuario autenticado puede leer productos
    next();
};

/**
 * Middleware solo para administradores
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth?.isAuthenticated || !req.user) {
        logger.warn('Intento de acceso sin autenticación');
        HttpHandler.error(res, {
            code: UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
        return;
    }

    if (!req.auth.isAdmin) {
        logger.warn('Usuario sin privilegios de administrador intentando acceder', {
            userId: req.user.id,
            role: req.user.role
        });
        HttpHandler.error(res, {
            code: FORBIDDEN,
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