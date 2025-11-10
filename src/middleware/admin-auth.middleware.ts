import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt.config';
import { Logger } from '../utils/logger';
import { FORBIDDEN, UNAUTHORIZED } from '../constants/codes.constanst';
import HttpHandler from '../helpers/handler.helper';
import { AuthRequest } from '../interfaces/auth.interface';

const logger = Logger.getInstance('AdminAuth');

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    try {
        const authHeader = req.headers.authorization;
        
        // Validar presencia y formato del token
        if (!authHeader) {
            logger.warn('Intento de acceso sin token');
            return HttpHandler.error(res, {
                code: UNAUTHORIZED,
                message: 'Token no proporcionado'
            });
        }

        if (!authHeader.toLowerCase().startsWith('bearer ')) {
            logger.warn('Token con formato incorrecto');
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
                logger.warn('Token expirado');
                return HttpHandler.error(res, {
                    code: UNAUTHORIZED,
                    message: 'Token expirado'
                });
            }

            if (jwtError instanceof jwt.JsonWebTokenError) {
                logger.warn('Token inválido', { error: jwtError.message });
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
            return HttpHandler.error(res, {
                code: FORBIDDEN,
                message: 'Se requieren privilegios de administrador'
            });
        }

        logger.info('Acceso de administrador autorizado', {
            userId: req.user.id,
            email: req.user.email
        });
        next();
    } catch (error) {
        logger.error('Error en autenticación de administrador', error);
        return HttpHandler.error(res, {
            code: UNAUTHORIZED,
            message: 'Error en autenticación'
        });
    }
};

export default adminAuthMiddleware;