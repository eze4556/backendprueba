import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import HttpHandler from '../helpers/handler.helper';
import { FORBIDDEN, UNAUTHORIZED } from '../constants/codes.constanst';
import jwt from 'jsonwebtoken';

// Configuración del secreto JWT (idealmente debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_seguro';

/**
 * Middleware para verificar que el usuario sea administrador
 */
const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      HttpHandler.response(res, UNAUTHORIZED, {
        message: 'Unauthorized',
        data: { error: 'Acceso denegado. Token no proporcionado.' }
      });
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    
    // Verificar que el usuario tenga rol de administrador
    if (req.user.role !== 'admin') {
      HttpHandler.response(res, FORBIDDEN, {
        message: 'Forbidden',
        data: { error: 'Acceso denegado. Se requieren privilegios de administrador.' }
      });
      return;
    }
    
    next();
  } catch (error) {
    HttpHandler.response(res, UNAUTHORIZED, {
      message: 'Unauthorized',
      data: { error: 'Token inválido o ha expirado.' }
    });
  }
};

export default adminAuthMiddleware;