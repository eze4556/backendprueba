import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.config';
import { Logger } from '../utils/logger';
import { UNAUTHORIZED, FORBIDDEN } from '../constants/codes.constanst';
import HttpHandler from '../helpers/handler.helper';
import { AuthRequest } from '../interfaces/auth.interface';



const logger = Logger.getInstance('Auth');

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
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
            return HttpHandler.error(res, {
                code: UNAUTHORIZED,
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
            return HttpHandler.error(res, {
                code: UNAUTHORIZED,
                message: 'Formato de token inválido'
            });
        }

        // Extraer y verificar token
        const token = authHeader.split(' ')[1];
        let decoded: jwt.JwtPayload;

        try {
            decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                logger.warn('Token expirado', { 
                    ip: req.ip,
                    path: req.path,
                    userId: 'anonymous',
                    timestamp: new Date().toISOString(),
                    type: 'EXPIRED_TOKEN'
                });
                return HttpHandler.error(res, {
                    code: UNAUTHORIZED,
                    message: 'Token expirado'
                });
            }

            if (jwtError instanceof jwt.JsonWebTokenError) {
                logger.warn('Token inválido', { 
                    error: jwtError.message,
                    ip: req.ip,
                    path: req.path,
                    userId: 'anonymous',
                    timestamp: new Date().toISOString(),
                    type: 'INVALID_TOKEN'
                });
                return HttpHandler.error(res, {
                    code: UNAUTHORIZED,
                    message: 'Token inválido'
                });
            }

            throw jwtError;
        }

        // Validar datos requeridos
        if (!decoded.id || !decoded.email || !decoded.role) {
            logger.warn('Token sin datos requeridos', { decoded });
            return HttpHandler.error(res, {
                code: UNAUTHORIZED,
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
    } catch (error) {
        logger.error('Error en autenticación', error);
        return HttpHandler.error(res, {
            code: UNAUTHORIZED,
            message: 'Error en autenticación'
        });
    }
};/**
 * Middleware para verificar que el usuario sea administrador
 */
export const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    // Verificar autenticación primero
    if (!req.auth?.isAuthenticated || !req.user) {
        logger.warn('Intento de acceso sin autenticación a ruta de admin');
        return HttpHandler.error(res, {
            code: UNAUTHORIZED,
            message: 'Autenticación requerida'
        });
    }

    // Verificar rol de administrador
    if (!req.auth.isAdmin) {
        logger.warn('Usuario sin privilegios intentando acceder a ruta de admin', {
            userId: req.user.id,
            role: req.user.role
        });
        return HttpHandler.error(res, {
            code: FORBIDDEN,
            message: 'Se requieren privilegios de administrador'
        });
    }

    logger.info('Acceso de administrador autorizado', {
        userId: req.user.id,
        role: req.user.role
    });
    next();
};
