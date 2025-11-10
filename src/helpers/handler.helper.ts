import { Response } from 'express';

interface ErrorResponse {
  code: number;
  message: string;
  errors?: any[];
}

class HttpHandler {
  /**
   * Maneja respuestas exitosas
   * @param res Express Response object
   * @param data Datos a enviar
   * @param status Código de estado HTTP (default: 200)
   */
  public success(res: Response, data: any, status: number = 200): Response {
    return res.status(status).json({
      success: true,
      data
    });
  }

  /**
   * Maneja respuestas de error
   * @param res Express Response object
   * @param error Objeto de error con código y mensaje
   */
  public error(res: Response, error: ErrorResponse): Response {
    return res.status(error.code).json({
      success: false,
      error: {
        message: error.message,
        ...(error.errors && { errors: error.errors })
      }
    });
  }
}

export default new HttpHandler();
