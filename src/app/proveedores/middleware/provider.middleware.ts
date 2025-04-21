import { Request, Response, NextFunction } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { BAD_REQUEST, FORBIDDEN, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import { AuthRequest as BaseAuthRequest } from '../../../middleware/auth.middleware';
import providerService from '../servicio/provider.service';

// Extend the user type in the JWT payload
declare module 'jsonwebtoken' {
    interface JwtPayload {
        id: string;
        email: string;
        role: string;
        providerId?: string;
        organizationId?: string;
    }
}

interface CustomJwtPayload {
    id: string;
    email: string;
    role: string;
    providerId?: string;
    organizationId?: string;
}

interface AuthRequest extends Request, BaseAuthRequest {
    user?: CustomJwtPayload;
    providerId?: string;
    organizationId?: string;
}

class ProviderMiddleware {
  private providerService = providerService;

  /**
   * Verifica si el usuario es dueño del proveedor o es un administrador
   */
  public isProviderOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    try {
      const providerId = req.params.providerId || req.body.providerId;
      
      if (!providerId) {
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'ID de proveedor requerido' }
        });
      }

      // Si el usuario es admin, permitimos acceso
      if (req.user?.role === 'admin') {
        return next();
      }

      // Si el providerId del token coincide con el providerId de la solicitud
      if (req.user?.providerId === providerId) {
        return next();
      }

      return HttpHandler.response(res, FORBIDDEN, {
        message: 'Forbidden',
        data: { error: 'No tiene permisos para realizar esta acción' }
      });
    } catch (error) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (error as Error).message }
      });
    }
  };

  /**
   * Verifica si el proveedor está aprobado
   */
  public isProviderApproved = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const providerId = req.params.providerId || req.body.providerId || req.user?.providerId;
      
      if (!providerId) {
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'ID de proveedor requerido' }
        });
      }

      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return HttpHandler.response(res, BAD_REQUEST, {
          message: 'Bad request error',
          data: { error: 'ID de organización requerido' }
        });
      }
      
      const isApproved = await this.providerService.isProviderApproved(providerId, organizationId);
      
      if (!isApproved) {
        return HttpHandler.response(res, FORBIDDEN, {
          message: 'Forbidden',
          data: { error: 'El proveedor no está aprobado o no existe' }
        });
      }

      return next();
    } catch (error) {
      return HttpHandler.response(res, INTERNAL_ERROR, {
        message: 'Internal Error',
        data: { error: (error as Error).message }
      });
    }
  };
}

export default new ProviderMiddleware();