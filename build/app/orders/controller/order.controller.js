"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const order_service_1 = __importDefault(require("../services/order.service"));
const order_models_1 = require("../models/order.models");
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class OrderController {
    /**
     * POST /api/order/create
     * Crea una nueva orden desde el carrito del usuario
     */
    async createOrder(req, res) {
        try {
            const userId = req.user.id;
            const { shippingAddress, shippingMethod, paymentMethod, billingAddress, invoiceRequired, customerNotes } = req.body;
            // Validaciones
            if (!shippingAddress) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'shippingAddress is required'
                });
            }
            if (!paymentMethod) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'paymentMethod is required'
                });
            }
            if (!shippingMethod) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'shippingMethod is required'
                });
            }
            // Validar shippingMethod
            if (!Object.values(order_models_1.ShippingMethod).includes(shippingMethod)) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.BAD_REQUEST, message: 'Invalid shipping method' });
            }
            const order = await order_service_1.default.createOrderFromCart({
                userId,
                items: [], // Se obtienen del carrito
                shippingAddress,
                shippingMethod,
                paymentMethod,
                billingAddress,
                invoiceRequired,
                customerNotes
            });
            return handler_helper_1.default.success(res, {
                message: 'Order created successfully',
                order
            }, codes_constanst_1.CREATED);
        }
        catch (error) {
            console.error('Error creating order:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to create order' });
        }
    }
    /**
     * POST /api/order/calculate-shipping
     * Calcula el costo de envío
     */
    async calculateShipping(req, res) {
        try {
            const { items, shippingAddress, destination, method } = req.body;
            // Soportar tanto formato antiguo (shippingAddress) como nuevo (destination)
            const address = shippingAddress || destination;
            if (!items || !address) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'items and destination/shippingAddress are required'
                });
            }
            if (!Array.isArray(items)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'items must be an array'
                });
            }
            const shippingCalc = await order_service_1.default.calculateShipping(items, address, method || 'standard' // Método por defecto
            );
            return handler_helper_1.default.success(res, { shipping: shippingCalc });
        }
        catch (error) {
            console.error('Error calculating shipping:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to calculate shipping' });
        }
    }
    /**
     * POST /api/order/validate-stock
     * Valida disponibilidad de stock
     */
    async validateStock(req, res) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items)) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.BAD_REQUEST, message: 'Invalid items array' });
            }
            const validation = await order_service_1.default.validateStock(items);
            return handler_helper_1.default.success(res, { validation });
        }
        catch (error) {
            console.error('Error validating stock:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to validate stock' });
        }
    }
    /**
     * GET /api/order
     * Obtiene todas las órdenes del usuario
     */
    async getUserOrders(req, res) {
        try {
            const userId = req.user.id;
            const status = req.query.status;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const result = await order_service_1.default.getUserOrders(userId, status, limit, skip);
            return handler_helper_1.default.success(res, {
                orders: result.orders,
                total: result.total,
                page,
                totalPages: Math.ceil(result.total / limit)
            });
        }
        catch (error) {
            console.error('Error fetching user orders:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to fetch orders' });
        }
    }
    /**
     * GET /api/order/:id
     * Obtiene una orden específica
     */
    async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const order = await order_service_1.default.getOrderById(id, userId);
            if (!order) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Order not found' });
            }
            return handler_helper_1.default.success(res, { order });
        }
        catch (error) {
            console.error('Error fetching order:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to fetch order' });
        }
    }
    /**
     * PUT /api/order/:id/status
     * Actualiza el estado de una orden (admin/provider)
     */
    async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, note } = req.body;
            if (!status) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.BAD_REQUEST, message: 'Status is required' });
            }
            if (!Object.values(order_models_1.OrderStatus).includes(status)) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.BAD_REQUEST, message: 'Invalid status' });
            }
            const order = await order_service_1.default.updateOrderStatus(id, status, note);
            if (!order) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Order not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Order status updated successfully',
                order
            });
        }
        catch (error) {
            console.error('Error updating order status:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to update order status' });
        }
    }
    /**
     * POST /api/order/:id/cancel
     * Cancela una orden
     */
    async cancelOrder(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { reason } = req.body;
            if (!reason) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.BAD_REQUEST, message: 'Cancellation reason is required' });
            }
            const order = await order_service_1.default.cancelOrder(id, userId, reason);
            if (!order) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Order not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Order cancelled successfully',
                order
            });
        }
        catch (error) {
            console.error('Error cancelling order:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to cancel order' });
        }
    }
    /**
     * PUT /api/order/:id/tracking
     * Actualiza información de tracking (admin/provider)
     */
    async updateTracking(req, res) {
        try {
            const { id } = req.params;
            const trackingData = req.body;
            const order = await order_service_1.default.updateTracking(id, trackingData);
            if (!order) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Order not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Tracking information updated successfully',
                order
            });
        }
        catch (error) {
            console.error('Error updating tracking:', error);
            return handler_helper_1.default.error(res, { code: codes_constanst_1.INTERNAL_ERROR, message: error.message || 'Failed to update tracking' });
        }
    }
}
exports.default = new OrderController();
//# sourceMappingURL=order.controller.js.map