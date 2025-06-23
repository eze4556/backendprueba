import { Router, Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import UserControllers from '../controllers/user.controllers';
import * as UserMiddleware from '../middlewares/user.middlewares';
import CodeMiddleware from '../../codes/middlewares/code.middlewares';
import Token from '../../../auth/token/token';
import { ParsedQs } from 'qs';
import User from '../models/user.models';

const router = Router();

// Middleware para verificar que el email no exista en la base de datos
export const checkEmail = async (
  req: Request<ParamsDictionary, any, any, ParsedQs>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Supón que tienes un modelo User con un método findOne
    const user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Solicitud de registro (envía código)
router.post(
  '/register_request',
  checkEmail, // Verifica que el email no exista
  CodeMiddleware.sendCode,   // Envía código de verificación
  (req, res) => res.status(200).json({ message: 'Verification code sent' })
);

// Registro de usuario (con código)
router.post(
  '/register_user',
  CodeMiddleware.checkCode, // Verifica código
  UserControllers.registerUser // Registra usuario
);

// Editar usuario (requiere token)
router.put(
  '/edit_user',
  Token.verifyToken,
  UserControllers.editUser
);

// Eliminar usuario (requiere token)
router.delete(
  '/delete_user',
  Token.verifyToken,
  UserControllers.deleteUser
);

// Obtener datos de usuario (requiere token)
router.get(
  '/get_data',
  Token.verifyToken,
  UserControllers.getUser
);

export default router;