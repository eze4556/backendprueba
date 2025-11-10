"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reservation_controller_1 = __importDefault(require("../controllers/reservation.controller"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/reservation
 * Crear una nueva reserva
 * Body: { professionalId, serviceType, date, duration, price, notes? }
 */
router.post('/', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.createReservation(req, res);
});
/**
 * GET /api/reservation/availability/:professionalId
 * Obtener disponibilidad de un profesional
 * Query params: startDate, endDate (ISO 8601 format)
 */
router.get('/availability/:professionalId', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.getAvailability(req, res);
});
/**
 * POST /api/reservation/availability
 * Actualizar disponibilidad de un profesional
 * Body: { professionalId, schedule, blockedDates? }
 */
router.post('/availability', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.updateAvailability(req, res);
});
/**
 * GET /api/reservation/user
 * Obtener reservas del usuario autenticado
 * Query params: status?, page?, limit?
 */
router.get('/user', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.getUserReservations(req, res);
});
/**
 * GET /api/reservation/professional/:professionalId
 * Obtener reservas de un profesional
 * Query params: status?, page?, limit?
 */
router.get('/professional/:professionalId', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.getProfessionalReservations(req, res);
});
/**
 * PUT /api/reservation/:id/confirm
 * Confirmar una reserva
 */
router.put('/:id/confirm', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.confirmReservation(req, res);
});
/**
 * POST /api/reservation/:id/cancel
 * Cancelar una reserva
 * Body: { reason? }
 */
router.post('/:id/cancel', auth_middleware_1.authMiddleware, (req, res) => {
    reservation_controller_1.default.cancelReservation(req, res);
});
exports.default = router;
//# sourceMappingURL=reservation.routes.js.map