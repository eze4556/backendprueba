import { Router } from 'express';
import Token from '../../../auth/token/token';
import CodeMiddleware from '../middlewares/code.middlewares';
const router: Router = Router();

router.post(
  '/validate',
  Token.verifyToken, // Verify token
  CodeMiddleware.validateCode, // Validate sent code
  Token.generateToken // Generate token
);

export default router;
