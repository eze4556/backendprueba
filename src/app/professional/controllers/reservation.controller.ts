import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import reservationService from '../services/reservation.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_ERROR, CREATED } from '../../../constants/codes.constanst';
import { ReservationStatus } from '../models/reservation.models';
import mongoose from 'mongoose';

class ReservationController {
  
  /**
   * POST /api/reservation
   * Crear una nueva reserva
   */
  public async createReservation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { professionalId, serviceType, date, duration, price, notes } = req.body;
      
      if (!professionalId || !serviceType || !date || !duration || !price) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'professionalId, serviceType, date, duration and price are required'
        });
      }

      // Validar ObjectId del profesional
      if (!mongoose.Types.ObjectId.isValid(professionalId)) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Invalid professionalId format'
        });
      }
      
      const reservation = await reservationService.createReservation(
        userId,
        professionalId,
        serviceType,
        new Date(date),
        duration,
        price,
        notes
      );
      
      return HttpHandler.success(res, { 
        message: 'Reservation created successfully',
        reservation 
      }, CREATED);
      
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Professional not found' ? NOT_FOUND : 
              error.message === 'Selected time slot is not available' ? BAD_REQUEST :
              INTERNAL_ERROR,
        message: error.message || 'Failed to create reservation'
      });
    }
  }
  
  /**
   * GET /api/reservation/availability/:professionalId
   * Obtener disponibilidad de un profesional
   */
  public async getAvailability(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { professionalId } = req.params;
      const { startDate, endDate, date } = req.query;
      
      // Soportar tanto date (single date) como startDate/endDate (range)
      let start: Date;
      let end: Date;
      
      if (date) {
        // Si solo envían date, usar ese día
        start = new Date(date as string);
        end = new Date(date as string);
        end.setHours(23, 59, 59, 999); // Fin del día
      } else if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Either date or startDate and endDate are required'
        });
      }
      
      const availability = await reservationService.getAvailability(
        professionalId,
        start,
        end
      );
      
      return HttpHandler.success(res, { availability });
      
    } catch (error: any) {
      console.error('Error getting availability:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Availability not configured for this professional' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to get availability'
      });
    }
  }
  
  /**
   * POST /api/reservation/availability
   * Actualizar disponibilidad (solo para profesionales)
   */
  public async updateAvailability(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { professionalId, schedule, blockedDates } = req.body;
      
      if (!professionalId || !schedule) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'professionalId and schedule are required'
        });
      }
      
      if (!Array.isArray(schedule) || schedule.length !== 7) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'schedule must be an array of 7 days'
        });
      }
      
      const availability = await reservationService.updateAvailability(
        professionalId,
        schedule,
        blockedDates ? blockedDates.map((d: string) => new Date(d)) : undefined
      );
      
      return HttpHandler.success(res, { 
        message: 'Availability updated successfully',
        availability 
      });
      
    } catch (error: any) {
      console.error('Error updating availability:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to update availability'
      });
    }
  }
  
  /**
   * GET /api/reservation/user
   * Obtener reservas del usuario autenticado
   */
  public async getUserReservations(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { status, page = 1, limit = 10 } = req.query;
      
      const result = await reservationService.getUserReservations(
        userId,
        status as ReservationStatus,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, result);
      
    } catch (error: any) {
      console.error('Error getting user reservations:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to get reservations'
      });
    }
  }
  
  /**
   * GET /api/reservation/professional/:professionalId
   * Obtener reservas de un profesional
   */
  public async getProfessionalReservations(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { professionalId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;
      
      const result = await reservationService.getProfessionalReservations(
        professionalId,
        status as ReservationStatus,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, result);
      
    } catch (error: any) {
      console.error('Error getting professional reservations:', error);
      return HttpHandler.error(res, {
        code: INTERNAL_ERROR,
        message: error.message || 'Failed to get reservations'
      });
    }
  }
  
  /**
   * PUT /api/reservation/:id/confirm
   * Confirmar una reserva
   */
  public async confirmReservation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      const reservation = await reservationService.confirmReservation(id);
      
      return HttpHandler.success(res, { 
        message: 'Reservation confirmed',
        reservation 
      });
      
    } catch (error: any) {
      console.error('Error confirming reservation:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Reservation not found' ? NOT_FOUND : INTERNAL_ERROR,
        message: error.message || 'Failed to confirm reservation'
      });
    }
  }
  
  /**
   * POST /api/reservation/:id/cancel
   * Cancelar una reserva
   */
  public async cancelReservation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { reason } = req.body;
      
      const reservation = await reservationService.cancelReservation(id, userId, reason);
      
      return HttpHandler.success(res, { 
        message: 'Reservation cancelled',
        reservation 
      });
      
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      return HttpHandler.error(res, {
        code: error.message === 'Reservation not found' ? NOT_FOUND :
              error.message === 'Unauthorized' ? BAD_REQUEST :
              error.message === 'Reservation already cancelled' ? BAD_REQUEST :
              INTERNAL_ERROR,
        message: error.message || 'Failed to cancel reservation'
      });
    }
  }
}

export default new ReservationController();
