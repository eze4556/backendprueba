import { Request, Response, NextFunction } from 'express';

// Clase personalizada para errores de la API
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para manejar errores
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  // Si es un ApiError, usamos su código de estado
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      status: 'error',
      statusCode: err.statusCode
    });
  }
  
  // Para errores no controlados
  return res.status(500).json({
    message: 'Error interno del servidor',
    status: 'error',
    statusCode: 500
  });
};

// Middleware para rutas no encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: `Ruta no encontrada: ${req.originalUrl}`,
    status: 'error',
    statusCode: 404
  });
};