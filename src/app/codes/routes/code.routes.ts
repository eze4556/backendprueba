import { Router } from 'express';
import Token from '../../../auth/token/token';
import CodeMiddleware from '../middlewares/code.middlewares';
const router: Router = Router();


// Ruta para enviar código de verificación
router.post(
  '/',
  CodeMiddleware.sendCode // Genera y envía el código
);

// Ruta para validar código
router.post(
  '/validate',
  Token.verifyToken, // Verify token
  CodeMiddleware.validateCode, // Validate sent code
  Token.generateToken // Generate token
);

export default router;
