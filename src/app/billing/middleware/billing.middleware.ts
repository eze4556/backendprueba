import { Request, Response, NextFunction } from 'express';

export function billingAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Validar JWT y rol de forma segura
  const user = typeof req.user === 'object' ? req.user as any : null;
  const role = user?.role || user?.rol;
  if (!user || !role || !['admin', 'contador'].includes(role)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
}
