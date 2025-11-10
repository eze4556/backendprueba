import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import orderService from '../services/order.service';
import { OrderStatus, ShippingMethod } from '../models/order.models';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, CREATED, BAD_REQUEST, NOT_FOUND, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class OrderController {
  
  /**
   * POST /api/order/create
   * Crea una nueva orden desde el carrito del usuario
   */
  public async createOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const {
        shippingAddress,
        shippingMethod,
        paymentMethod,
        billingAddress,
        invoiceRequired,
        customerNotes
      } = req.body;
      
      // Validaciones
      if (!shippingAddress) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'shippingAddress is required' 
        });
      }

      if (!paymentMethod) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'paymentMethod is required' 
        });
      }

      if (!shippingMethod) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'shippingMethod is required' 
        });
      }
      
      // Validar shippingMethod
      if (!Object.values(ShippingMethod).includes(shippingMethod)) {
        return HttpHandler.error(res, { code: BAD_REQUEST, message: 'Invalid shipping method' });
      }
      
      const order = await orderService.createOrderFromCart({
        userId,
        items: [], // Se obtienen del carrito
        shippingAddress,
        shippingMethod,
        paymentMethod,
        billingAddress,
        invoiceRequired,
        customerNotes
      });
      
      return HttpHandler.success(res, { 
        message: 'Order created successfully',
        order 
      }, CREATED);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to create order' });
    }
  }
  
  /**
   * POST /api/order/calculate-shipping
   * Calcula el costo de envío
   */
  public async calculateShipping(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { items, shippingAddress, destination, method } = req.body;
      
      // Soportar tanto formato antiguo (shippingAddress) como nuevo (destination)
      const address = shippingAddress || destination;
      
      if (!items || !address) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'items and destination/shippingAddress are required' 
        });
      }

      if (!Array.isArray(items)) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'items must be an array' 
        });
      }
      
      const shippingCalc = await orderService.calculateShipping(
        items,
        address,
        method || 'standard' // Método por defecto
      );
      
      return HttpHandler.success(res, { shipping: shippingCalc });
      
    } catch (error: any) {
      console.error('Error calculating shipping:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to calculate shipping' });
    }
  }
  
  /**
   * POST /api/order/validate-stock
   * Valida disponibilidad de stock
   */
  public async validateStock(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return HttpHandler.error(res, { code: BAD_REQUEST, message: 'Invalid items array' });
      }
      
      const validation = await orderService.validateStock(items);
      
      return HttpHandler.success(res, { validation });
      
    } catch (error: any) {
      console.error('Error validating stock:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to validate stock' });
    }
  }
  
  /**
   * GET /api/order
   * Obtiene todas las órdenes del usuario
   */
  public async getUserOrders(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const status = req.query.status as OrderStatus | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      
      const result = await orderService.getUserOrders(userId, status, limit, skip);
      
      return HttpHandler.success(res, {
        orders: result.orders,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit)
      });
      
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to fetch orders' });
    }
  }
  
  /**
   * GET /api/order/:id
   * Obtiene una orden específica
   */
  public async getOrderById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const order = await orderService.getOrderById(id, userId);
      
      if (!order) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Order not found' });
      }
      
      return HttpHandler.success(res, { order });
      
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to fetch order' });
    }
  }
  
  /**
   * PUT /api/order/:id/status
   * Actualiza el estado de una orden (admin/provider)
   */
  public async updateOrderStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      
      if (!status) {
        return HttpHandler.error(res, { code: BAD_REQUEST, message: 'Status is required' });
      }
      
      if (!Object.values(OrderStatus).includes(status)) {
        return HttpHandler.error(res, { code: BAD_REQUEST, message: 'Invalid status' });
      }
      
      const order = await orderService.updateOrderStatus(id, status, note);
      
      if (!order) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Order not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Order status updated successfully',
        order 
      });
      
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to update order status' });
    }
  }
  
  /**
   * POST /api/order/:id/cancel
   * Cancela una orden
   */
  public async cancelOrder(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { reason } = req.body;
      
      if (!reason) {
        return HttpHandler.error(res, { code: BAD_REQUEST, message: 'Cancellation reason is required' });
      }
      
      const order = await orderService.cancelOrder(id, userId, reason);
      
      if (!order) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Order not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Order cancelled successfully',
        order 
      });
      
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to cancel order' });
    }
  }
  
  /**
   * PUT /api/order/:id/tracking
   * Actualiza información de tracking (admin/provider)
   */
  public async updateTracking(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const trackingData = req.body;
      
      const order = await orderService.updateTracking(id, trackingData);
      
      if (!order) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Order not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Tracking information updated successfully',
        order 
      });
      
    } catch (error: any) {
      console.error('Error updating tracking:', error);
      return HttpHandler.error(res, { code: INTERNAL_ERROR, message: error.message || 'Failed to update tracking' });
    }
  }
}

export default new OrderController();
