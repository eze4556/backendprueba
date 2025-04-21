import { Request, Response } from 'express';
import UserModel from '../models/user.models';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class PasswordController {
  /**
   * Change password
   * @param req
   * @param res
   * @returns
   */
  public async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { _id, password } = req;
      await UserModel.findByIdAndUpdate({ _id }, { $set: { 'auth_data.password': password } });
      return HttpHandler.response(res, SUCCESS, { message: 'Password reset successfully', data: { _id } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }
}

export default new PasswordController();
