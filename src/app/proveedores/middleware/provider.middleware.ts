import { Request, Response, NextFunction } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { BAD_REQUEST, FORBIDDEN, INTERNAL_ERROR } from '../../../constants/codes.constanst';

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



class ProviderMiddleware {
  private providerService = providerService;

  /**
   * Verifica si el usuario es dueño del proveedor o es un administrador
   */
  public isProviderOrAdmin = (req: Request, res: Response, next: NextFunction): Response | void => {
    try {
      const providerId = req.params.providerId || req.body.providerId;
      
      if (!providerId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'ID de proveedor requerido'
        });
      }

      // Si el usuario es admin, permitimos acceso

      const user = (req as any).user as CustomJwtPayload | undefined;
      if (user?.role === 'admin') {
        return next();
      }
      if (user?.providerId === providerId) {
        return next();
      }

      return HttpHandler.error(res, {
        code: FORBIDDEN,
        message: 'No tiene permisos para realizar esta acción'
      });
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  };

  /**
   * Verifica si el proveedor está aprobado
   */
  public isProviderApproved = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const user = (req as any).user as CustomJwtPayload | undefined;
      const providerId = req.params.providerId || req.body.providerId || user?.providerId;
      if (!providerId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'ID de proveedor requerido'
        });
      }
      const organizationId = user?.organizationId;
      if (!organizationId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'ID de organización requerido'
        });
      }
      
      const isApproved = await this.providerService.isProviderApproved(providerId, organizationId);
      
      if (!isApproved) {
        return HttpHandler.error(res, {
          code: FORBIDDEN,
          message: 'El proveedor no está aprobado o no existe'
        });
      }

      return next();
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  };
}

export default new ProviderMiddleware();