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
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Invalid code, expirated token or user not exist'
        });
      }
      req.expiresIn = '1h'; // Send expiration time 1h;
      next(); // Continue to Generate Token
    } catch (e) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (e as Error).message
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
    const { email } = req.body;
    console.log('sendCode middleware - email received:', email);
    
    if (!email) {
      console.log('sendCode middleware - email is missing');
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'Email is required'
      });
    }
    
    console.log('sendCode middleware - checking for existing codes...');
    // Find previous codes and check expiration
    const codeResult = await CodeModel.findOne({
      $and: [{ email }, { expiration: { $gte: new Date() } }],
    });
    console.log('sendCode middleware - existing code result:', codeResult);
    
    if (codeResult) {
      console.log('sendCode middleware - previous code found, rejecting request');
      // Prevent another request before the expiration time is reached
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'Previous unvalidated code'
      });
    }
    
    console.log('sendCode middleware - generating new code...');
    const randomCode = codeTool.generateCode(); // generate random code;
    console.log('sendCode middleware - generated code:', randomCode);
    
    console.log('sendCode middleware - creating code model...');
    // save the code on mongo and set expiration time
    const code: CodeInterface = new CodeModel({
      email,
      code: randomCode,
      expiration: moment().add(5, 'minutes').toDate(), // Expiration time in 5min,
    });
    
    console.log('sendCode middleware - saving code to database...');
    await code.save();
    console.log('sendCode middleware - code saved successfully');
    
    // Responder directamente al frontend con el código generado
    return res.status(200).json({
      success: true,
      message: 'Código generado y enviado correctamente',
      code: randomCode
    });
  } catch (e) {
    console.error('sendCode middleware - error:', e);
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (e as Error).message
    });
  }
}
public async checkCode(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const { code, email } = req.body;
    console.log('checkCode middleware - email received:', email);
    console.log('checkCode middleware - code received:', code);
    
    if (!email || !code) {
      console.log('checkCode middleware - missing email or code');
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'Email and code are required'
      });
    }
    
    console.log('checkCode middleware - checking code in database...');
    
    // Buscar el código sin restricción de expiración primero
    const codeCheck = await CodeModel.findOne({
      $and: [
        { email }, 
        { code }
      ],
    });
    
    console.log('checkCode middleware - code found (any expiration):', codeCheck ? 'YES' : 'NO');
    if (codeCheck) {
      console.log('checkCode middleware - code details:', {
        email: codeCheck.email,
        code: codeCheck.code,
        expiration: codeCheck.expiration,
        now: new Date(),
        isExpired: codeCheck.expiration < new Date()
      });
    }
    
    // Buscar códigos válidos (no expirados) para este email
    const validCodes = await CodeModel.find({
      $and: [
        { email }, 
        { expiration: { $gte: new Date() } }
      ],
    });
    
    console.log('checkCode middleware - valid codes for email:', validCodes.map(c => c.code));
    
    // Ahora buscar y eliminar el código válido
    const codeResult = await CodeModel.findOneAndDelete({
      $and: [
        { email }, 
        { code },
        { expiration: { $gte: new Date() } }
      ],
    });
    
    console.log('checkCode middleware - code result:', codeResult ? 'FOUND' : 'NOT FOUND');
    
    if (!codeResult) {
      console.log('checkCode middleware - invalid code, sending error');
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'Invalid code, expired code or user not exist'
      });
    }
    
    console.log('checkCode middleware - code validated successfully');
    // Set email and password in request for the controller
    req.email = email;
    req.password = req.body.auth_data?.password;
    
    next();
  } catch (e) {
    console.error('checkCode middleware - error:', e);
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (e as Error).message
    });
  }
}
}

export default new CodeMiddleware();
