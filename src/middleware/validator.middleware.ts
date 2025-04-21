import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from './error.middleware';

/**
 * Middleware para validar los resultados de express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Ejecutar todas las validaciones
    await Promise.all(validations.map(validation => validation.run(req)));

    // Verificar si hay errores
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Si hay errores, enviar respuesta de error
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Error de validación',
      errors: errors.array()
    });
  };
};