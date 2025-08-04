import { Request, Response } from 'express';
import UserModel from '../models/user.models';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';

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
      return HttpHandler.response(res, SUCCESS, { message: 'Password reset successfully', data: { _id } });
    } catch (e) {
      // Maneja errores internos
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }
}

export default new PasswordController();
