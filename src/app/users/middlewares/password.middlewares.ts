import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import PasswordTool from '../../../tools/password.tools';
import HttpHandler from '../../../helpers/handler.helper';
import UserModel from '../models/user.models';
import { BAD_REQUEST, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class PasswordMiddleware {
  /**
   * Check password complexity
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async passwordComplexity(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { password } = req.body.auth_data || req.body; // Extract password
      // Check password complexity
      if (!PasswordTool.validatePassword(password)) {
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: {
            error: 'Incorrect format. (Minimum 8 characters, uppercase, lowercase, at least 2 numbers and must not contain blank spaces)',
          },
        });
      }
      req.password = password; // Set password
      next();
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Compare new password with stored password
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async comparePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { _id } = req; // Extract _id from token
      const { password } = req.body; // Extract new password from body
      const oldPassword = await UserModel.findById({ _id }).then((user) => {
        return user?.auth_data.password; // Find old user password
      });
      const samePassword = bcrypt.compareSync(password, oldPassword!); // Compare old password with new password
      if (samePassword) {
        // If is the same password return error
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'Wrong password' },
        });
      }
      const hashedPassword = await bcrypt.hash(password!, 10); // Hash and set the password in auth_data
      req.password = hashedPassword; // Set on request the new password
      next();
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Set allow password change on true
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async allowChange(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body; // Extract _id from token
      const user = await UserModel.findOneAndUpdate(
        { 'primary_data.email': email },
        { $set: { 'permissions.allow_password_change': true } } // Set flag on true
      );
      req.email = email; // Save email for token
      req._id = user!._id; // Save _id for token
      next();
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Check if user can change the password
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async checkAllow(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { _id } = req; // Extract _id from token
      const user = await UserModel.findOneAndUpdate(
        { $and: [{ _id }, { 'permissions.allow_password_change': true }] },
        { $set: { 'permissions.allow_password_change': false } }
      ); // Check if user is allowed to change password and set false
      if (!user) {
        // If user is not allowed
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: "Can't change password'" },
        });
      }
      next();
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }
}

export default new PasswordMiddleware();
