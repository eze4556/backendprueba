"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = __importDefault(require("../controller/order.controller"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/order/create
 * Crea una nueva orden desde el carrito del usuario
 * Requiere autenticación
 */
router.post('/create', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.createOrder(req, res));
/**
 * POST /api/order/calculate-shipping
 * Calcula el costo de envío
 * Requiere autenticación
 */
router.post('/calculate-shipping', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.calculateShipping(req, res));
/**
 * POST /api/order/validate-stock
 * Valida disponibilidad de stock
 * Requiere autenticación
 */
router.post('/validate-stock', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.validateStock(req, res));
/**
 * GET /api/order
 * Obtiene todas las órdenes del usuario
 * Query params: status?, limit?, page?
 * Requiere autenticación
 */
router.get('/', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.getUserOrders(req, res));
/**
 * GET /api/order/:id
 * Obtiene una orden específica por ID
 * Requiere autenticación
 */
router.get('/:id', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.getOrderById(req, res));
/**
 * PUT /api/order/:id/status
 * Actualiza el estado de una orden
 * Body: { status: OrderStatus, note?: string }
 * Requiere autenticación (admin/provider)
 */
router.put('/:id/status', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.updateOrderStatus(req, res));
/**
 * POST /api/order/:id/cancel
 * Cancela una orden
 * Body: { reason: string }
 * Requiere autenticación
 */
router.post('/:id/cancel', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.cancelOrder(req, res));
/**
 * PUT /api/order/:id/tracking
 * Actualiza información de tracking
 * Body: { carrier?, trackingNumber?, trackingUrl?, estimatedDelivery? }
 * Requiere autenticación (admin/provider)
 */
router.put('/:id/tracking', auth_middleware_1.authMiddleware, (req, res) => order_controller_1.default.updateTracking(req, res));
exports.default = router;
//# sourceMappingURL=order.routes.js.map