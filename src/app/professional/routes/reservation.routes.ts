import { Router } from 'express';
import reservationController from '../controllers/reservation.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/reservation
 * Crear una nueva reserva
 * Body: { professionalId, serviceType, date, duration, price, notes? }
 */
router.post('/', authMiddleware, (req, res) => {
  reservationController.createReservation(req as any, res);
});

/**
 * GET /api/reservation/availability/:professionalId
 * Obtener disponibilidad de un profesional
 * Query params: startDate, endDate (ISO 8601 format)
 */
router.get('/availability/:professionalId', authMiddleware, (req, res) => {
  reservationController.getAvailability(req as any, res);
});

/**
 * POST /api/reservation/availability
 * Actualizar disponibilidad de un profesional
 * Body: { professionalId, schedule, blockedDates? }
 */
router.post('/availability', authMiddleware, (req, res) => {
  reservationController.updateAvailability(req as any, res);
});

/**
 * GET /api/reservation/user
 * Obtener reservas del usuario autenticado
 * Query params: status?, page?, limit?
 */
router.get('/user', authMiddleware, (req, res) => {
  reservationController.getUserReservations(req as any, res);
});

/**
 * GET /api/reservation/professional/:professionalId
 * Obtener reservas de un profesional
 * Query params: status?, page?, limit?
 */
router.get('/professional/:professionalId', authMiddleware, (req, res) => {
  reservationController.getProfessionalReservations(req as any, res);
});

/**
 * PUT /api/reservation/:id/confirm
 * Confirmar una reserva
 */
router.put('/:id/confirm', authMiddleware, (req, res) => {
  reservationController.confirmReservation(req as any, res);
});

/**
 * POST /api/reservation/:id/cancel
 * Cancelar una reserva
 * Body: { reason? }
 */
router.post('/:id/cancel', authMiddleware, (req, res) => {
  reservationController.cancelReservation(req as any, res);
});

export default router;
