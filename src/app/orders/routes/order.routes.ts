import { Router } from 'express';
import orderController from '../controller/order.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/order/create
 * Crea una nueva orden desde el carrito del usuario
 * Requiere autenticación
 */
router.post('/create', authMiddleware, (req, res) => orderController.createOrder(req as any, res));

/**
 * POST /api/order/calculate-shipping
 * Calcula el costo de envío
 * Requiere autenticación
 */
router.post('/calculate-shipping', authMiddleware, (req, res) => orderController.calculateShipping(req as any, res));

/**
 * POST /api/order/validate-stock
 * Valida disponibilidad de stock
 * Requiere autenticación
 */
router.post('/validate-stock', authMiddleware, (req, res) => orderController.validateStock(req as any, res));

/**
 * GET /api/order
 * Obtiene todas las órdenes del usuario
 * Query params: status?, limit?, page?
 * Requiere autenticación
 */
router.get('/', authMiddleware, (req, res) => orderController.getUserOrders(req as any, res));

/**
 * GET /api/order/:id
 * Obtiene una orden específica por ID
 * Requiere autenticación
 */
router.get('/:id', authMiddleware, (req, res) => orderController.getOrderById(req as any, res));

/**
 * PUT /api/order/:id/status
 * Actualiza el estado de una orden
 * Body: { status: OrderStatus, note?: string }
 * Requiere autenticación (admin/provider)
 */
router.put('/:id/status', authMiddleware, (req, res) => orderController.updateOrderStatus(req as any, res));

/**
 * POST /api/order/:id/cancel
 * Cancela una orden
 * Body: { reason: string }
 * Requiere autenticación
 */
router.post('/:id/cancel', authMiddleware, (req, res) => orderController.cancelOrder(req as any, res));

/**
 * PUT /api/order/:id/tracking
 * Actualiza información de tracking
 * Body: { carrier?, trackingNumber?, trackingUrl?, estimatedDelivery? }
 * Requiere autenticación (admin/provider)
 */
router.put('/:id/tracking', authMiddleware, (req, res) => orderController.updateTracking(req as any, res));

export default router;
