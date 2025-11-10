import { Request, Response } from 'express';
import UserModel from '../models/user.models';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, INTERNAL_ERROR, BAD_REQUEST } from '../../../constants/codes.constanst';
import passwordRecoveryService from '../services/password-recovery.service';

// Controlador para operaciones relacionadas con contraseñas
class PasswordController {
  /**
   * Cambia la contraseña de un usuario
   * @param req Petición HTTP con los datos necesarios
   * @param res Respuesta HTTP
   * @returns Respuesta con el resultado de la operación
   */
  public async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      // Extrae el id y la nueva contraseña del request
      const { _id, password } = req;
      // Actualiza la contraseña en la base de datos
      await UserModel.findByIdAndUpdate({ _id }, { $set: { 'auth_data.password': password } });
      // Devuelve respuesta de éxito
      return HttpHandler.success(res, {
        message: 'Password reset successfully',
        _id
      });
    } catch (e) {
      // Maneja errores internos
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (e as Error).message
      });
    }
  }

  /**
   * Solicitar recuperación de contraseña
   * POST /api/password/forgot
   */
  public async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'El email es requerido'
        });
      }

      const result = await passwordRecoveryService.requestPasswordReset(email);

      return HttpHandler.success(res, result);
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  }

  /**
   * Validar token de reset
   * GET /api/password/validate/:token
   */
  public async validateToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;

      if (!token) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'El token es requerido'
        });
      }

      const result = await passwordRecoveryService.validateResetToken(token);

      if (!result.valid) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: result.message
        });
      }

      return HttpHandler.success(res, {
        valid: true,
        message: result.message
      });
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  }

  /**
   * Resetear contraseña con token
   * POST /api/password/reset/:token
   */
  public async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (!token || !password || !confirmPassword) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Token, contraseña y confirmación son requeridos'
        });
      }

      if (password !== confirmPassword) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Las contraseñas no coinciden'
        });
      }

      const result = await passwordRecoveryService.resetPassword(token, password);

      if (!result.success) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: result.message
        });
      }

      return HttpHandler.success(res, {
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  }
}

export default new PasswordController();
