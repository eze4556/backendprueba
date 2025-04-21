import { Response } from 'express';

class HttpHandler {
  /**
   *
   * @param res
   * @param status
   * @param message
   * @param data
   * @returns
   */

  public response(res: Response, status: number, response: { message: string; data: {} }): Response {
    return res.status(status).json({ response });
  }
}

export default new HttpHandler();
