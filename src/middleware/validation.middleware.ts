import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }
  next();
};

/**
 * Validaciones comunes para usuarios
 */
export const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password debe contener al menos una letra minúscula, una mayúscula y un número'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
  handleValidationErrors
];

/**
 * Validación para login
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  body('password')
    .notEmpty()
    .withMessage('Password es requerido'),
  handleValidationErrors
];

/**
 * Validación para parámetros de ID
 */
export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido de MongoDB'),
  handleValidationErrors
];

/**
 * Validación para paginación
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entero entre 1 y 100'),
  handleValidationErrors
];

/**
 * Sanitización de texto general
 */
export const sanitizeText = [
  body('*')
    .if(body('*').exists())
    .trim()
    .escape(),
  handleValidationErrors
];

/**
 * Validación para archivos de imagen
 */
export const validateImageFile = (req: Request, res: Response, next: NextFunction) => {
  if (req.file) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: 'Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP.'
      });
    }
    
    if (req.file.size > maxSize) {
      return res.status(400).json({
        message: 'Archivo demasiado grande. Máximo 5MB permitido.'
      });
    }
  }
  next();
};

/**
 * Validación para productos
 */
export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre del producto debe tener entre 2 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descripción no puede exceder 1000 caracteres'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número positivo'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Categoría debe ser un ID válido'),
  handleValidationErrors
];

/**
 * Validación para pagos
 */
export const validatePayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Monto debe ser mayor a 0'),
  body('currency')
    .isIn(['USD', 'EUR', 'MXN'])
    .withMessage('Moneda debe ser USD, EUR o MXN'),
  body('paymentMethod')
    .isIn(['card', 'paypal', 'bank_transfer'])
    .withMessage('Método de pago no válido'),
  handleValidationErrors
];