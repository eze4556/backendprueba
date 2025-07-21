import { Router, Request, Response, NextFunction } from 'express';
import { checkActive } from '../middlewares/user.middlewares';
import PasswordMiddleware from '../middlewares/password.middlewares';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';
import Token from '../../../auth/token/token';
import UserModel from '../models/user.models';
import bcrypt from 'bcrypt';
import HttpHandler from '../../../helpers/handler.helper';
import { BAD_REQUEST, UNAUTHORIZED, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import userController from '../controllers/user.controllers';

const router: Router = Router();

// Middleware para verificar credenciales contra la base de datos
async function checkCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, contraseña } = req.body;
    
    console.log('checkCredentials - email recibido:', email);
    console.log('checkCredentials - contraseña recibida:', contraseña ? 'EXISTS' : 'MISSING');
    
    // Validar que se proporcionen email y contraseña
    if (!email || !contraseña) {
      console.log('checkCredentials - faltan email o contraseña');
      HttpHandler.response(res, BAD_REQUEST, {
        message: 'Bad request error',
        data: { error: 'Email y contraseña son requeridos' }
      });
      return;
    }
    
    // Buscar usuario en la base de datos
    console.log('checkCredentials - buscando usuario en BD...');
    const user = await UserModel.findOne({ 'primary_data.email': email.toLowerCase() });
    
    if (!user) {
      console.log('checkCredentials - usuario no encontrado');
      HttpHandler.response(res, UNAUTHORIZED, {
        message: 'Unauthorized',
        data: { error: 'Credenciales incorrectas' }
      });
      return;
    }
    
    console.log('checkCredentials - usuario encontrado, verificando contraseña...');
    
    // Verificar contraseña usando bcrypt
    const isValidPassword = await bcrypt.compare(contraseña, user.auth_data.password);
    
    if (!isValidPassword) {
      console.log('checkCredentials - contraseña incorrecta');
      HttpHandler.response(res, UNAUTHORIZED, {
        message: 'Unauthorized',
        data: { error: 'Credenciales incorrectas' }
      });
      return;
    }
    
    console.log('checkCredentials - contraseña válida, verificando estado activo...');
    
    // Verificar que el usuario esté activo
    if (!user.permissions.active) {
      console.log('checkCredentials - usuario inactivo');
      HttpHandler.response(res, UNAUTHORIZED, {
        message: 'Unauthorized',
        data: { error: 'Usuario inactivo. Contacta al administrador.' }
      });
      return;
    }
    
    console.log('checkCredentials - autenticación exitosa, configurando request...');
    
    // Agregar datos del usuario al request para el siguiente middleware
    req.body._id = user._id;
    req.body.email = user.primary_data.email;
    req.body.name = user.primary_data.name;
    
    console.log('checkCredentials - datos configurados:', {
      _id: user._id,
      email: user.primary_data.email,
      name: user.primary_data.name
    });
    
    next();
  } catch (error) {
    console.error('checkCredentials - error:', error);
    HttpHandler.response(res, INTERNAL_ERROR, {
      message: 'Internal Error',
      data: { error: 'Error interno del servidor' }
    });
    return;
  }
}

// Ruta principal de login usando el controlador
router.post('/', userController.loginUser);

// Ruta alternativa usando middleware (para compatibilidad)
router.post('/middleware', 
  checkCredentials, // Verificar credenciales contra BD
  (req: Request, res: Response, next: NextFunction) => {
    HistoryMiddleware.saveHistory('start session')(req, res, next);
  }, // Guardar historial
  Token.generateToken // Generar token
);

export default router;