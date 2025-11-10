import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Middleware para validar que un parámetro sea un ObjectId válido de MongoDB
 * @param paramName - Nombre del parámetro a validar (por defecto 'id')
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: `Parameter '${paramName}' is required`
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId`
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar múltiples parámetros como ObjectIds
 * @param paramNames - Array de nombres de parámetros a validar
 */
export const validateMultipleObjectIds = (...paramNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId`
        });
      }
    }
    
    next();
  };
};

/**
 * Función helper para validar ObjectId
 * @param id - ID a validar
 * @returns boolean
 */
export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};
