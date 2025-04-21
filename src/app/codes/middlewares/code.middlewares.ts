import { NextFunction, Request, Response } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import CodeModel, { CodeInterface } from '../models/code.models';
import { BAD_REQUEST, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import codeTool from '../../../tools/code.tools';
import moment from 'moment';

class CodeMiddleware {
  /**
   * Validate an existing code
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async validateCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { code } = req.body;
      const { email } = req;
      // Check if exist: email and code, if validated is false, and expiration is lower than Date.now, and set validated in true
      const result = await CodeModel.findOneAndDelete({
        $and: [{ email }, { code }],
      });
      if (!result) {
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'Invalid code, expirated token or user not exist' },
        });
      }
      req.expiresIn = '1h'; // Send expiration time 1h;
      next(); // Continue to Generate Token
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Send random code
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async sendCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req; // Extract email from body or token;
      // Find previous codes and check expiration
      const codeResult = await CodeModel.findOne({
        $and: [{ email }, { expiration: { $gte: new Date().getTime() } }],
      });
      if (codeResult) {
        // Prevent another request before the expiration time is reached
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'Previous unvalidated code' },
        });
      }
      const randomCode = codeTool.generateCode(); // generate random code;
      // save the code on mongo and set expiration time
      const code: CodeInterface = new CodeModel({
        email,
        code: randomCode,
        expiration: moment().add(5, 'minutes'), // Expiration time in 5min,
      });
      await code.save();
      req.expiresIn = '5m';
      next();
    } catch (e) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (e as Error).message },
      });
    }
  }

  /**
   * Check a code not exist
   * @param req
   * @param res
   * @param next
   * @returns
   */
  public async checkCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req; // Extract email from token
      const codeExist = await CodeModel.findOne({ email });
      if (codeExist) {
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'Previous unvalidated code' },
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

export default new CodeMiddleware();
