import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extender la interfaz Request para incluir el usuario autenticado
export interface AuthRequest extends Request {
  user?: {
      id: string;
      email: string;
      role: string;
  } | JwtPayload;
}

// Configuración del secreto JWT (idealmente debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_seguro';

/**
 * Middleware para verificar que el usuario esté autenticado
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const adminAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Primero verificamos que esté autenticado
  authMiddleware(req, res, (err) => {
    // Si hay error o no hay respuesta del middleware de autenticación
    if (err) {
      return next(err);
    }
    
    // Si el usuario no está definido (podría pasar en casos extraños)
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado.' });
    }
    
    // Luego verificamos que sea administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de administrador.' });
    }
    
    // Todo está bien, el usuario es administrador
    next();
  });
};