import { Router } from 'express';
import Token from '../../../auth/token/token';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';
import CodeMiddleware from '../../codes/middlewares/code.middlewares';
import PasswordMiddleware from '../middlewares/password.middlewares';
import PasswordController from '../controllers/password.controllers';
const router: Router = Router();

router.post('/change');

router.post(
  '/password_request',
  PasswordMiddleware.allowChange, // Set allow_password_change on true
  CodeMiddleware.sendCode, // Send the code and set request
  HistoryMiddleware.saveHistory('password change request'), // Save history
  Token.generateToken // Generate token
);

router.post(
  '/change_password',
  Token.verifyToken, // Verify token and extract email
  CodeMiddleware.checkCode, // Validate there is not a previously code
  PasswordMiddleware.checkAllow, // Check if change password is allowed
  PasswordMiddleware.passwordComplexity, // Verify password complexity and set request
  PasswordMiddleware.comparePassword, // Compare new password with old password
  HistoryMiddleware.saveHistory('password changed'), // Save history
  PasswordController.changePassword // Change password
);

// ============================================
// NUEVOS ENDPOINTS DE RECUPERACIÓN DE CONTRASEÑA
// ============================================

/**
 * @route   POST /api/password/forgot
 * @desc    Solicitar recuperación de contraseña (envía email con token)
 * @access  Public
 */
router.post('/forgot', PasswordController.forgotPassword);

/**
 * @route   GET /api/password/validate/:token
 * @desc    Validar token de recuperación
 * @access  Public
 */
router.get('/validate/:token', PasswordController.validateToken);

/**
 * @route   POST /api/password/reset/:token
 * @desc    Resetear contraseña con token
 * @access  Public
 */
router.post('/reset/:token', PasswordController.resetPassword);

export default router;
