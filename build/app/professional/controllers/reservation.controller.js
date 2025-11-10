"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reservation_service_1 = __importDefault(require("../services/reservation.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const mongoose_1 = __importDefault(require("mongoose"));
class ReservationController {
    /**
     * POST /api/reservation
     * Crear una nueva reserva
     */
    async createReservation(req, res) {
        try {
            const userId = req.user.id;
            const { professionalId, serviceType, date, duration, price, notes } = req.body;
            if (!professionalId || !serviceType || !date || !duration || !price) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'professionalId, serviceType, date, duration and price are required'
                });
            }
            // Validar ObjectId del profesional
            if (!mongoose_1.default.Types.ObjectId.isValid(professionalId)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Invalid professionalId format'
                });
            }
            const reservation = await reservation_service_1.default.createReservation(userId, professionalId, serviceType, new Date(date), duration, price, notes);
            return handler_helper_1.default.success(res, {
                message: 'Reservation created successfully',
                reservation
            }, codes_constanst_1.CREATED);
        }
        catch (error) {
            console.error('Error creating reservation:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Professional not found' ? codes_constanst_1.NOT_FOUND :
                    error.message === 'Selected time slot is not available' ? codes_constanst_1.BAD_REQUEST :
                        codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to create reservation'
            });
        }
    }
    /**
     * GET /api/reservation/availability/:professionalId
     * Obtener disponibilidad de un profesional
     */
    async getAvailability(req, res) {
        try {
            const { professionalId } = req.params;
            const { startDate, endDate, date } = req.query;
            // Soportar tanto date (single date) como startDate/endDate (range)
            let start;
            let end;
            if (date) {
                // Si solo envían date, usar ese día
                start = new Date(date);
                end = new Date(date);
                end.setHours(23, 59, 59, 999); // Fin del día
            }
            else if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            }
            else {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Either date or startDate and endDate are required'
                });
            }
            const availability = await reservation_service_1.default.getAvailability(professionalId, start, end);
            return handler_helper_1.default.success(res, { availability });
        }
        catch (error) {
            console.error('Error getting availability:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Availability not configured for this professional' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get availability'
            });
        }
    }
    /**
     * POST /api/reservation/availability
     * Actualizar disponibilidad (solo para profesionales)
     */
    async updateAvailability(req, res) {
        try {
            const { professionalId, schedule, blockedDates } = req.body;
            if (!professionalId || !schedule) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'professionalId and schedule are required'
                });
            }
            if (!Array.isArray(schedule) || schedule.length !== 7) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'schedule must be an array of 7 days'
                });
            }
            const availability = await reservation_service_1.default.updateAvailability(professionalId, schedule, blockedDates ? blockedDates.map((d) => new Date(d)) : undefined);
            return handler_helper_1.default.success(res, {
                message: 'Availability updated successfully',
                availability
            });
        }
        catch (error) {
            console.error('Error updating availability:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to update availability'
            });
        }
    }
    /**
     * GET /api/reservation/user
     * Obtener reservas del usuario autenticado
     */
    async getUserReservations(req, res) {
        try {
            const userId = req.user.id;
            const { status, page = 1, limit = 10 } = req.query;
            const result = await reservation_service_1.default.getUserReservations(userId, status, parseInt(page), parseInt(limit));
            return handler_helper_1.default.success(res, result);
        }
        catch (error) {
            console.error('Error getting user reservations:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get reservations'
            });
        }
    }
    /**
     * GET /api/reservation/professional/:professionalId
     * Obtener reservas de un profesional
     */
    async getProfessionalReservations(req, res) {
        try {
            const { professionalId } = req.params;
            const { status, page = 1, limit = 10 } = req.query;
            const result = await reservation_service_1.default.getProfessionalReservations(professionalId, status, parseInt(page), parseInt(limit));
            return handler_helper_1.default.success(res, result);
        }
        catch (error) {
            console.error('Error getting professional reservations:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get reservations'
            });
        }
    }
    /**
     * PUT /api/reservation/:id/confirm
     * Confirmar una reserva
     */
    async confirmReservation(req, res) {
        try {
            const { id } = req.params;
            const reservation = await reservation_service_1.default.confirmReservation(id);
            return handler_helper_1.default.success(res, {
                message: 'Reservation confirmed',
                reservation
            });
        }
        catch (error) {
            console.error('Error confirming reservation:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Reservation not found' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to confirm reservation'
            });
        }
    }
    /**
     * POST /api/reservation/:id/cancel
     * Cancelar una reserva
     */
    async cancelReservation(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { reason } = req.body;
            const reservation = await reservation_service_1.default.cancelReservation(id, userId, reason);
            return handler_helper_1.default.success(res, {
                message: 'Reservation cancelled',
                reservation
            });
        }
        catch (error) {
            console.error('Error cancelling reservation:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Reservation not found' ? codes_constanst_1.NOT_FOUND :
                    error.message === 'Unauthorized' ? codes_constanst_1.BAD_REQUEST :
                        error.message === 'Reservation already cancelled' ? codes_constanst_1.BAD_REQUEST :
                            codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to cancel reservation'
            });
        }
    }
}
exports.default = new ReservationController();
//# sourceMappingURL=reservation.controller.js.map