import { Request, Response } from 'express';
import CategorieModel from '../models/categorie.models';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class CategorieController {
  /**
   * Change password
   * @param req
   * @param res
   * @returns
   */
  public async getData(req: Request, res: Response): Promise<Response> {
    try {
      const categories = await CategorieModel.find({});
      return HttpHandler.response(res, SUCCESS, { message: 'Response successfully', data: { categories } });
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }
}

export default new CategorieController();
