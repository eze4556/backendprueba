import { Request, Response } from 'express';
import UserModel, { UserInterface } from '../models/user.models';
import HttpHandler from '../../../helpers/handler.helper';
import bcrypt from 'bcrypt';
import { SUCCESS, INTERNAL_ERROR, CREATED, FORBIDDEN } from '../../../constants/codes.constanst';

class UserController {
  /**
   * Register a single user
   * @param req
   * @param res
   * @returns
   */
  public async registerUser(req: Request, res: Response): Promise<Response> {
    try {
      // Destructure data
      const { primary_data, billing_data, auth_data } = req.body;
      const { email, password } = req; // Extract email and hashedPassword from request

      primary_data.email = email; // Set email in object primary_data
      auth_data.password = await bcrypt.hash(password!, 10); // Hash and set the password in auth_data
      const user: UserInterface = new UserModel({
        primary_data,
        billing_data,
        auth_data,
      });
      const data = await user.save(); // Save new user
      return HttpHandler.response(res, CREATED, {
        message: 'User created successfully',
        data: { _id: data._id },
      });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Edit user
   * @param req
   * @param res
   * @returns
   */
  public async editUser(req: Request, res: Response): Promise<Response> {
    try {
      const { _id } = req; // Extract _id from token
      const { primary_data, billing_data } = req.body; // Extract all data from body
      await UserModel.findById({ _id }).then(async (user) => {
        delete primary_data.email; // Delete email from body
        const new_primary_data = { ...user?.primary_data, ...primary_data }; // Merge new primary_data with old primary_data
        const new_billing_data = { ...user?.billing_data, ...billing_data }; // Merge new billing_data with old billing_data
        await UserModel.findByIdAndUpdate({ _id }, { $set: { primary_data: new_primary_data, billing_data: new_billing_data } });
      });
      return HttpHandler.response(res, SUCCESS, { message: 'User edited successfully', data: { _id } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Get user data
   * @param req
   * @param res
   * @returns
   */
  public async getUser(req: Request, res: Response): Promise<Response> {
    try {
      const { _id } = req;
      const user = await UserModel.findById({ _id });
      if (!user) {
        return HttpHandler.response(res, FORBIDDEN, {
          message: 'Forbidden',
          data: { error: 'User not found' },
        });
      }
      return HttpHandler.response(res, SUCCESS, {
        message: 'Response successfully',
        data: { primary_data: user?.primary_data, billing_data: user?.billing_data },
      });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }
}

export default new UserController();
