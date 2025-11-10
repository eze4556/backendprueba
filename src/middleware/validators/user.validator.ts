import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateUserRegistration = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres.')
    .trim()
    .escape(),
  body('name')
    .not()
    .isEmpty()
    .withMessage('El nombre es requerido.')
    .trim()
    .escape(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
