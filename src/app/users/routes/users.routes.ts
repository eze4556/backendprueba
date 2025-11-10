import { Router, Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import UserControllers from '../controllers/user.controllers';
import * as UserMiddleware from '../middlewares/user.middlewares';
import CodeMiddleware from '../../codes/middlewares/code.middlewares';
import Token from '../../../auth/token/token';
import { ParsedQs } from 'qs';
import User from '../models/user.models';
import upload from '../../../config/multer.config';
import { 
  extractRoleInfo,
  requireSensitiveOperation,
  requirePermissions,
  adminOnly
} from '../../../middleware/role-validation.middleware';
import { Permission } from '../../../interfaces/roles.interface';

const router = Router();

// Middleware para verificar que el email no exista en la base de datos
export const checkEmail = async (
  req: Request<ParamsDictionary, any, any, ParsedQs>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    console.log('checkEmail middleware - email received:', email);
    
    if (!email) {
      console.log('checkEmail middleware - email is missing');
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('checkEmail middleware - checking database for existing user...');
    // Buscar en la estructura anidada primary_data.email
    const user = await User.findOne({ 'primary_data.email': email.toLowerCase() });
    console.log('checkEmail middleware - user found:', user ? 'YES' : 'NO');
    
    if (user) {
      console.log('checkEmail middleware - user already exists, rejecting');
      return res.status(409).json({ message: 'Email already exists' });
    }

    console.log('checkEmail middleware - email is available, calling next()');
    next();
  } catch (error) {
    console.error('Error in checkEmail middleware:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

import { validateUserRegistration } from '../../../middleware/validators/user.validator';

// ... (código existente)

// Solicitud de registro (envía código)
router.post(
  '/register_request',
  validateUserRegistration, // <-- Añadido validador
  checkEmail, // Verifica que el email no exista
  CodeMiddleware.sendCode,   // Envía código de verificación
  (req: Request, res: Response) => {
    console.log('register_request - sending success response');
    res.status(200).json({ 
      success: true, 
      message: 'Verification code sent successfully' 
    });
  }
);

// ... (código existente)

// Registro de usuario (con código)
router.post(
  '/register_user',
  CodeMiddleware.checkCode, // Verifica código
  UserControllers.registerUser // Registra usuario
);

// Editar usuario (requiere token y permisos)
router.put(
  '/edit_user',
  extractRoleInfo,
  requirePermissions(Permission.EDIT_USER),
  UserControllers.editUser
);

// Eliminar usuario (solo administradores)
router.delete(
  '/delete_user',
  extractRoleInfo,
  requireSensitiveOperation('USER_MANAGEMENT'),
  requirePermissions(Permission.DELETE_USER),
  UserControllers.deleteUser
);

// Obtener datos de usuario (requiere autenticación)
router.get(
  '/get_data',
  extractRoleInfo,
  requirePermissions(Permission.VIEW_USER),
  UserControllers.getUser
);

// Guardar información personal (usuarios pueden editar su propio perfil)
router.post(
  '/personal-info',
  extractRoleInfo,
  requirePermissions(Permission.EDIT_USER),
  UserControllers.savePersonalInfo
);

// Actualizar rol del usuario (solo administradores)
router.put(
  '/update-role',
  extractRoleInfo,
  requireSensitiveOperation('USER_MANAGEMENT'),
  adminOnly,
  UserControllers.updateUserRole
);

// Guardar información del perfil de emprendedor (requiere token y multer para archivos)
router.post(
  '/profile/update',
  extractRoleInfo,
  requirePermissions(Permission.EDIT_USER),
  upload.single('profileImage'),
  UserControllers.saveProfileInfo
);

// Actualizar información de cuenta (usuarios pueden actualizar su cuenta)
router.put(
  '/account-info',
  extractRoleInfo,
  requirePermissions(Permission.EDIT_USER),
  UserControllers.updateAccountInfo
);

// Obtener información del perfil del usuario actual (requiere autenticación)
router.get(
  '/profile',
  extractRoleInfo,
  requirePermissions(Permission.VIEW_USER),
  UserControllers.getCurrentUserProfile
);

export default router;