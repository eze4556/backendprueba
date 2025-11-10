import { Request, Response, NextFunction } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { BAD_REQUEST, FORBIDDEN, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import { SubscriptionService } from '../service/subscription.service';

// Definir la interfaz AuthRequest localmente
interface AuthRequest extends Request {
  user?: any;
}

export class SubscriptionMiddleware {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Verifica si el usuario es el propietario de la suscripción
   */
  public isSubscriptionOwner = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const subscriptionId = req.params.subscriptionId || req.body.subscriptionId;
      
      if (!subscriptionId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'ID de suscripción requerido'
        });
      }

      // Si el usuario es admin, permitimos acceso
      if (req.user?.role === 'admin') {
        return next();
      }

      // Obtenemos la suscripción y verificamos si el usuario es el propietario
      const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Suscripción no encontrada'
        });
      }

      if (subscription.providerId !== req.user?.id) {
        return HttpHandler.error(res, {
          code: FORBIDDEN,
          message: 'No tiene permisos para acceder a esta suscripción'
        });
      }

      next();
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  };

  /**
   * Verifica si hay cupo disponible en la suscripción
   */
  public hasMemberSlot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'ID de suscripción requerido'
        });
      }

      const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Suscripción no encontrada'
        });
      }

      const canAddMember = this.subscriptionService.canAddMembers(subscription);
      
      if (!canAddMember) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'No hay cupos disponibles en el plan actual'
        });
      }

      next();
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  };

  /**
   * Verifica si el usuario es miembro de la suscripción
   */
  public isMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Usuario no identificado'
        });
      }

      // Método a implementar en el servicio de suscripciones
      const isMember = await this.subscriptionService.isUserMember(userId);
      
      if (!isMember) {
        return HttpHandler.error(res, {
          code: FORBIDDEN,
          message: 'El usuario no pertenece a ninguna suscripción activa'
        });
      }

      next();
    } catch (error) {
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: (error as Error).message
      });
    }
  };
}

// Crear y exportar una instancia
const subscriptionMiddleware = new SubscriptionMiddleware();
export default subscriptionMiddleware;