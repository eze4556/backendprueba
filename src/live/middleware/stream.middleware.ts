import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces/auth.interface';

/**
 * Middleware para verificar que el usuario tenga permisos de streaming
 * Todos los roles pueden transmitir EXCEPTO: user (usuarios comunes)
 */
export const streamPermissionMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || typeof req.user === 'string') {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  // Obtener el rol del usuario (puede estar en role, type, o primary_data.type)
  const userRole = (req.user.role || req.user.type || '').toLowerCase();
  
  // Roles NO permitidos para transmitir (solo usuarios comunes están excluidos)
  const blockedRoles = ['user', 'usuarios', 'cliente'];

  // Permitir super_admin expl�citamente
  if (userRole === 'super_admin' || userRole === 'admin') {
    next();
    return;
  }
  
  if (!userRole || blockedRoles.includes(userRole)) {
    res.status(403).json({ 
      error: 'Los usuarios comunes no tienen permisos para transmitir en vivo',
      message: 'Solo profesionales, proveedores, vendedores y otros roles de negocio pueden crear transmisiones',
      allowedRoles: ['admin', 'professional', 'autonomous', 'dedicated', 'provider', 'seller', 'moderator']
    });
    return;
  }

  next();
};

/**
 * Middleware para verificar límites de streaming del usuario
 */
export const streamLimitMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || typeof req.user === 'string') {
    res.status(401).json({ error: 'Usuario no autenticado' });
    return;
  }

  try {
    // Importar aquí para evitar dependencias circulares
    const Stream = (await import('../models/stream.model')).default;
    const { StreamStatus } = await import('../models/stream.model');

    // Verificar si el usuario ya tiene streams activos
    const activeStreamsCount = await Stream.countDocuments({
      'streamer.userId': req.user._id,
      status: { $in: [StreamStatus.WAITING, StreamStatus.LIVE] }
    });

    // Límite de streams simultáneos por usuario
    const maxSimultaneousStreams = 1;

    if (activeStreamsCount >= maxSimultaneousStreams) {
      res.status(429).json({ 
        error: `Ya tienes ${activeStreamsCount} stream(s) activo(s)`,
        limit: maxSimultaneousStreams
      });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Error al verificar límites de streaming',
      details: error.message 
    });
  }
};

/**
 * Middleware para validar datos del stream
 */
export const validateStreamData = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'El título del stream es requerido' });
    return;
  }

  if (title.length > 200) {
    res.status(400).json({ error: 'El título no puede exceder 200 caracteres' });
    return;
  }

  const { description } = req.body;
  if (description && description.length > 1000) {
    res.status(400).json({ error: 'La descripción no puede exceder 1000 caracteres' });
    return;
  }

  next();
};

