"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const order_models_1 = __importStar(require("../models/order.models"));
const cart_models_1 = __importDefault(require("../models/cart.models"));
const productTypes_models_1 = __importDefault(require("../../productTypes/models/productTypes.models"));
const nodemailer_1 = __importDefault(require("nodemailer"));
class OrderService {
    /**
     * Calcula el costo de envío basado en el método y ubicación
     */
    async calculateShipping(items, shippingAddress, method) {
        // Calcular peso/volumen total (simplificado)
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        let cost = 0;
        let estimatedDays = 0;
        switch (method) {
            case order_models_1.ShippingMethod.STANDARD:
                // Envío estándar: $500 base + $100 por item adicional
                cost = 500 + (totalItems > 1 ? (totalItems - 1) * 100 : 0);
                estimatedDays = 5;
                break;
            case order_models_1.ShippingMethod.EXPRESS:
                // Envío express: $1500 base + $200 por item adicional
                cost = 1500 + (totalItems > 1 ? (totalItems - 1) * 200 : 0);
                estimatedDays = 2;
                break;
            case order_models_1.ShippingMethod.PICKUP:
                // Retiro en punto de venta: gratis
                cost = 0;
                estimatedDays = 0;
                break;
        }
        // Envío gratis para compras mayores a $50000
        if (subtotal >= 50000 && method === order_models_1.ShippingMethod.STANDARD) {
            cost = 0;
        }
        return { method, cost, estimatedDays };
    }
    /**
     * Calcula impuestos (IVA 21% en Argentina)
     */
    calculateTax(subtotal) {
        // IVA 21% (ya incluido en el precio en Argentina)
        // Para este caso, retornamos 0 porque el IVA ya está incluido
        return 0;
    }
    /**
     * Valida disponibilidad de stock para todos los productos
     */
    async validateStock(items) {
        const errors = [];
        for (const item of items) {
            const product = await productTypes_models_1.default.findById(item.productId);
            if (!product) {
                errors.push({
                    productId: item.productId.toString(),
                    available: 0,
                    requested: item.quantity
                });
                continue;
            }
            if (product.product_info.stock < item.quantity) {
                errors.push({
                    productId: item.productId.toString(),
                    available: product.product_info.stock,
                    requested: item.quantity
                });
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Reduce el stock de los productos
     */
    async reduceStock(items) {
        for (const item of items) {
            await productTypes_models_1.default.findByIdAndUpdate(item.productId, {
                $inc: { 'product_info.stock': -item.quantity }
            });
        }
    }
    /**
     * Restaura el stock de los productos (en caso de cancelación)
     */
    async restoreStock(items) {
        for (const item of items) {
            await productTypes_models_1.default.findByIdAndUpdate(item.productId, {
                $inc: { 'product_info.stock': item.quantity }
            });
        }
    }
    /**
     * Crea una nueva orden desde el carrito del usuario
     */
    async createOrderFromCart(data) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // 1. Obtener el carrito del usuario
            const cart = await cart_models_1.default.findOne({ userId: data.userId }).session(session);
            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }
            // 2. Validar stock
            const stockValidation = await this.validateStock(cart.items);
            if (!stockValidation.valid) {
                throw new Error(`Insufficient stock: ${stockValidation.errors.map(e => `Product ${e.productId} (available: ${e.available}, requested: ${e.requested})`).join(', ')}`);
            }
            // 3. Calcular costos
            const subtotal = cart.totalAmount;
            const shipping = await this.calculateShipping(cart.items, data.shippingAddress, data.shippingMethod);
            const tax = this.calculateTax(subtotal);
            const discount = 0; // Implementar lógica de cupones si es necesario
            const totalAmount = subtotal + shipping.cost + tax - discount;
            // 4. Generar número de orden
            const orderNumber = await order_models_1.default.generateOrderNumber();
            // 5. Crear la orden
            const order = new order_models_1.default({
                orderNumber,
                userId: data.userId,
                items: cart.items,
                subtotal,
                shippingCost: shipping.cost,
                tax,
                discount,
                totalAmount,
                status: order_models_1.OrderStatus.PENDING,
                shippingMethod: data.shippingMethod,
                shippingAddress: data.shippingAddress,
                paymentInfo: {
                    method: data.paymentMethod,
                    status: order_models_1.PaymentStatus.PENDING,
                    amount: totalAmount
                },
                billingAddress: data.billingAddress || data.shippingAddress,
                invoiceRequired: data.invoiceRequired || false,
                customerNotes: data.customerNotes
            });
            await order.save({ session });
            // 6. Reducir stock
            await this.reduceStock(cart.items);
            // 7. Limpiar el carrito
            cart.items = [];
            cart.totalItems = 0;
            cart.totalAmount = 0;
            await cart.save({ session });
            await session.commitTransaction();
            // 8. Enviar email de confirmación (sin bloquear)
            this.sendOrderConfirmationEmail(order).catch(err => console.error('Error sending order confirmation email:', err));
            return order;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Obtiene todas las órdenes de un usuario
     */
    async getUserOrders(userId, status, limit = 20, skip = 0) {
        const query = { userId };
        if (status) {
            query.status = status;
        }
        const [orders, total] = await Promise.all([
            order_models_1.default.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip),
            order_models_1.default.countDocuments(query)
        ]);
        return { orders, total };
    }
    /**
     * Obtiene una orden por ID
     */
    async getOrderById(orderId, userId) {
        const query = { _id: orderId };
        if (userId) {
            query.userId = userId;
        }
        return await order_models_1.default.findOne(query);
    }
    /**
     * Actualiza el estado de una orden
     */
    async updateOrderStatus(orderId, newStatus, note) {
        const order = await order_models_1.default.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        // Agregar al historial
        order.statusHistory.push({
            status: newStatus,
            date: new Date(),
            note
        });
        order.status = newStatus;
        // Actualizar fechas de tracking según el estado
        if (newStatus === order_models_1.OrderStatus.SHIPPED && order.shippingTracking) {
            order.shippingTracking.shippedDate = new Date();
        }
        if (newStatus === order_models_1.OrderStatus.DELIVERED && order.shippingTracking) {
            order.shippingTracking.deliveredDate = new Date();
        }
        await order.save();
        // Enviar email de actualización de estado
        this.sendStatusUpdateEmail(order).catch(err => console.error('Error sending status update email:', err));
        return order;
    }
    /**
     * Cancela una orden
     */
    async cancelOrder(orderId, userId, reason) {
        const order = await order_models_1.default.findOne({ _id: orderId, userId });
        if (!order) {
            throw new Error('Order not found');
        }
        // Solo se puede cancelar si está en ciertos estados
        const cancellableStatuses = [
            order_models_1.OrderStatus.PENDING,
            order_models_1.OrderStatus.CONFIRMED,
            order_models_1.OrderStatus.PREPARING
        ];
        if (!cancellableStatuses.includes(order.status)) {
            throw new Error(`Cannot cancel order in status: ${order.status}`);
        }
        // Restaurar stock
        await this.restoreStock(order.items);
        // Actualizar orden
        order.status = order_models_1.OrderStatus.CANCELLED;
        order.cancellationReason = reason;
        order.cancelledAt = new Date();
        order.cancelledBy = new mongoose_1.default.Types.ObjectId(userId);
        order.statusHistory.push({
            status: order_models_1.OrderStatus.CANCELLED,
            date: new Date(),
            note: `Cancelled by user: ${reason}`
        });
        await order.save();
        // Enviar email de cancelación
        this.sendCancellationEmail(order).catch(err => console.error('Error sending cancellation email:', err));
        return order;
    }
    /**
     * Actualiza información de tracking
     */
    async updateTracking(orderId, trackingData) {
        const order = await order_models_1.default.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }
        order.shippingTracking = {
            ...order.shippingTracking,
            ...trackingData
        };
        await order.save();
        return order;
    }
    /**
     * Envía email de confirmación de orden
     */
    async sendOrderConfirmationEmail(order) {
        // Configurar transporter (usar las mismas credenciales que password recovery)
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'
            }
        });
        const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>$${item.price.toFixed(2)}</td>
        <td>$${item.subtotal.toFixed(2)}</td>
      </tr>
    `).join('');
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .order-details { background: white; padding: 20px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f2f2f2; }
          .total { font-size: 18px; font-weight: bold; text-align: right; padding: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Orden Confirmada</h1>
          </div>
          <div class="content">
            <h2>¡Gracias por tu compra!</h2>
            <p>Tu orden ha sido recibida y está siendo procesada.</p>
            
            <div class="order-details">
              <h3>Detalles de la Orden</h3>
              <p><strong>Número de Orden:</strong> ${order.orderNumber}</p>
              <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
              <p><strong>Estado:</strong> ${order.status}</p>
              
              <h4>Productos</h4>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
              <p><strong>Envío:</strong> $${order.shippingCost.toFixed(2)}</p>
              ${order.discount > 0 ? `<p><strong>Descuento:</strong> -$${order.discount.toFixed(2)}</p>` : ''}
              <p class="total">Total: $${order.totalAmount.toFixed(2)}</p>
              
              <h4>Dirección de Envío</h4>
              <p>
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.streetName} ${order.shippingAddress.streetNumber}
                ${order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ''}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                Tel: ${order.shippingAddress.phone}
              </p>
            </div>
            
            <p>Te mantendremos informado sobre el estado de tu pedido.</p>
          </div>
          <div class="footer">
            <p>LikeVendor - Tu marketplace de confianza</p>
          </div>
        </div>
      </body>
      </html>
    `;
        // Nota: Necesitarás obtener el email del usuario desde la BD
        // Por ahora usamos un placeholder
        await transporter.sendMail({
            from: '"LikeVendor" <noreply@likevendor.com>',
            to: 'user@email.com', // Obtener del usuario
            subject: `Orden Confirmada - ${order.orderNumber}`,
            html
        });
    }
    /**
     * Envía email de actualización de estado
     */
    async sendStatusUpdateEmail(order) {
        // Similar a sendOrderConfirmationEmail pero con diferentes mensajes según el estado
        console.log(`Sending status update email for order ${order.orderNumber}, status: ${order.status}`);
        // Implementar según necesidad
    }
    /**
     * Envía email de cancelación
     */
    async sendCancellationEmail(order) {
        console.log(`Sending cancellation email for order ${order.orderNumber}`);
        // Implementar según necesidad
    }
}
exports.default = new OrderService();
//# sourceMappingURL=order.service.js.map