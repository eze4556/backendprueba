import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { load } from 'ts-dotenv';
import HttpHandler from '../../helpers/handler.helper';
import { CREATED, UNAUTHORIZED, FORBIDDEN, INTERNAL_ERROR } from '../../constants/codes.constanst';

const env = load({
  JWT_KEY: {
    type: String,
    optional: true
  },
});

const JWT_SECRET = env.JWT_KEY || process.env.JWT_SECRET || process.env.JWT_KEY || 'secure_secret_for_dev_only';
declare module 'express-serve-static-core' {
  interface Request {
    user?: string | JwtPayload;
  }
}

class Token {
  /**
   * Generate token
   * @param req
   * @param res
   */
  static generateToken = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { expiresIn } = req.body; // Cambiado de req a req.body
      const { _id, email } = req.body; // Cambiado de req a req.body
      const token = jwt.sign({ email: email!, _id: _id! }, JWT_SECRET, { expiresIn: expiresIn || '60d' }); // Generate token
      return HttpHandler.success(res, { message: 'Token created successfully', data: { token, expiresIn } }, CREATED);
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: 'Internal Error',
        errors: [(e as Error).message]
      });
    }
  };

  /**
   * Verify token and next()
   * @param req
   * @param res
   * @param next
   * @returns
   */
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader) {
        return res.status(403).json({
          response: {
            message: 'Forbidden',
            data: 'Access forbidden'
          }
        });
      }

      const token = authHeader.split(' ')[1]; // Asegúrate de que el token esté en el formato "Bearer <token>"
      if (!token) {
        return res.status(403).json({
          response: {
            message: 'Forbidden',
            data: 'Access forbidden'
          }
        });
      }

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({
            response: {
              message: 'Forbidden',
              data: 'Access forbidden'
            }
          });
        }
        req.user = decoded;
        next();
      });
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: 'Internal Error',
        errors: [(e as Error).message]
      });
    }
  }
}

export default Token;
