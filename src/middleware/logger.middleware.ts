import { Request, Response, NextFunction } from 'express';

// Middleware para registrar las solicitudes HTTP y su duración
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Registrar la entrada de la solicitud
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Guardar el tiempo de inicio para calcular la duración
  res.locals.startTime = start;
  
  // Cuando la respuesta se complete, mostrar la duración
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};