import { Request, Response, NextFunction } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import HistoryModel from '../../users/models/history.models';
import { INTERNAL_ERROR } from '../../../constants/codes.constanst';

class HistoryMiddleware {
  /**
   * Save a history log
   * @param log
   * @returns
   */
  public saveHistory(log: String): (req: Request, res: Response, next: NextFunction) => Promise<Response | void> {
    return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
      try {
        const { email } = req; // Extract email
        const historySession = new HistoryModel({
          email,
          log,
        });
        await historySession.save(); // Save new log in history
        next(); // next to generate token
      } catch (e) {
        return HttpHandler.response(res, INTERNAL_ERROR, {
          message: 'Internal Error',
          data: { error: (e as Error).message },
        });
      }
    };
  }
}

export default new HistoryMiddleware();
