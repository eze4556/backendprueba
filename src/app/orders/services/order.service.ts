import mongoose from 'mongoose';
import Order, { OrderInterface, OrderStatus, PaymentStatus, ShippingMethod, OrderItemInterface, ShippingAddressInterface } from '../models/order.models';
import Cart from '../models/cart.models';
import Product from '../../productTypes/models/productTypes.models';
import nodemailer from 'nodemailer';
import { environment } from '../../../environments/environments';

export interface CreateOrderData {
  userId: string;
  items: OrderItemInterface[];
  shippingAddress: ShippingAddressInterface;
  shippingMethod: ShippingMethod;
  paymentMethod: string;
  billingAddress?: ShippingAddressInterface;
  invoiceRequired?: boolean;
  customerNotes?: string;
}

export interface ShippingCalculation {
  method: ShippingMethod;
  cost: number;
  estimatedDays: number;
}

class OrderService {
  
  /**
   * Calcula el costo de envío basado en el método y ubicación
   */
  public async calculateShipping(
    items: OrderItemInterface[],
    shippingAddress: ShippingAddressInterface,
    method: ShippingMethod
  ): Promise<ShippingCalculation> {
    // Calcular peso/volumen total (simplificado)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    let cost = 0;
    let estimatedDays = 0;
    
    switch (method) {
      case ShippingMethod.STANDARD:
        // Envío estándar: $500 base + $100 por item adicional
        cost = 500 + (totalItems > 1 ? (totalItems - 1) * 100 : 0);
        estimatedDays = 5;
        break;
        
      case ShippingMethod.EXPRESS:
        // Envío express: $1500 base + $200 por item adicional
        cost = 1500 + (totalItems > 1 ? (totalItems - 1) * 200 : 0);
        estimatedDays = 2;
        break;
        
      case ShippingMethod.PICKUP:
        // Retiro en punto de venta: gratis
        cost = 0;
        estimatedDays = 0;
        break;
    }
    
    // Envío gratis para compras mayores a $50000
    if (subtotal >= 50000 && method === ShippingMethod.STANDARD) {
      cost = 0;
    }
    
    return { method, cost, estimatedDays };
  }
  
  /**
   * Calcula impuestos (IVA 21% en Argentina)
   */
  private calculateTax(subtotal: number): number {
    // IVA 21% (ya incluido en el precio en Argentina)
    // Para este caso, retornamos 0 porque el IVA ya está incluido
    return 0;
  }
  
  /**
   * Valida disponibilidad de stock para todos los productos
   */
  public async validateStock(items: OrderItemInterface[]): Promise<{ 
    valid: boolean; 
    errors: Array<{ productId: string; available: number; requested: number }> 
  }> {
    const errors: Array<{ productId: string; available: number; requested: number }> = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
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
  private async reduceStock(items: OrderItemInterface[]): Promise<void> {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { 'product_info.stock': -item.quantity }
      });
    }
  }
  
  /**
   * Restaura el stock de los productos (en caso de cancelación)
   */
  private async restoreStock(items: OrderItemInterface[]): Promise<void> {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { 'product_info.stock': item.quantity }
      });
    }
  }
  
  /**
   * Crea una nueva orden desde el carrito del usuario
   */
  public async createOrderFromCart(data: CreateOrderData): Promise<OrderInterface> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Obtener el carrito del usuario
      const cart = await Cart.findOne({ userId: data.userId }).session(session);
      
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      // 2. Validar stock
      const stockValidation = await this.validateStock(cart.items);
      if (!stockValidation.valid) {
        throw new Error(
          `Insufficient stock: ${stockValidation.errors.map(e => 
            `Product ${e.productId} (available: ${e.available}, requested: ${e.requested})`
          ).join(', ')}`
        );
      }
      
      // 3. Calcular costos
      const subtotal = cart.totalAmount;
      const shipping = await this.calculateShipping(
        cart.items,
        data.shippingAddress,
        data.shippingMethod
      );
      const tax = this.calculateTax(subtotal);
      const discount = 0; // Implementar lógica de cupones si es necesario
      const totalAmount = subtotal + shipping.cost + tax - discount;
      
      // 4. Generar número de orden
      const orderNumber = await (Order as any).generateOrderNumber();
      
      // 5. Crear la orden
      const order = new Order({
        orderNumber,
        userId: data.userId,
        items: cart.items,
        subtotal,
        shippingCost: shipping.cost,
        tax,
        discount,
        totalAmount,
        status: OrderStatus.PENDING,
        shippingMethod: data.shippingMethod,
        shippingAddress: data.shippingAddress,
        paymentInfo: {
          method: data.paymentMethod,
          status: PaymentStatus.PENDING,
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
      this.sendOrderConfirmationEmail(order).catch(err => 
        console.error('Error sending order confirmation email:', err)
      );
      
      return order;
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Obtiene todas las órdenes de un usuario
   */
  public async getUserOrders(
    userId: string,
    status?: OrderStatus,
    limit: number = 20,
    skip: number = 0
  ): Promise<{ orders: OrderInterface[]; total: number }> {
    const query: any = { userId };
    
    if (status) {
      query.status = status;
    }
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Order.countDocuments(query)
    ]);
    
    return { orders, total };
  }
  
  /**
   * Obtiene una orden por ID
   */
  public async getOrderById(orderId: string, userId?: string): Promise<OrderInterface | null> {
    const query: any = { _id: orderId };
    
    if (userId) {
      query.userId = userId;
    }
    
    return await Order.findOne(query);
  }
  
  /**
   * Actualiza el estado de una orden
   */
  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ): Promise<OrderInterface | null> {
    const order = await Order.findById(orderId);
    
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
    if (newStatus === OrderStatus.SHIPPED && order.shippingTracking) {
      order.shippingTracking.shippedDate = new Date();
    }
    
    if (newStatus === OrderStatus.DELIVERED && order.shippingTracking) {
      order.shippingTracking.deliveredDate = new Date();
    }
    
    await order.save();
    
    // Enviar email de actualización de estado
    this.sendStatusUpdateEmail(order).catch(err => 
      console.error('Error sending status update email:', err)
    );
    
    return order;
  }
  
  /**
   * Cancela una orden
   */
  public async cancelOrder(
    orderId: string,
    userId: string,
    reason: string
  ): Promise<OrderInterface | null> {
    const order = await Order.findOne({ _id: orderId, userId });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Solo se puede cancelar si está en ciertos estados
    const cancellableStatuses = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING
    ];
    
    if (!cancellableStatuses.includes(order.status)) {
      throw new Error(`Cannot cancel order in status: ${order.status}`);
    }
    
    // Restaurar stock
    await this.restoreStock(order.items);
    
    // Actualizar orden
    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = new mongoose.Types.ObjectId(userId);
    
    order.statusHistory.push({
      status: OrderStatus.CANCELLED,
      date: new Date(),
      note: `Cancelled by user: ${reason}`
    });
    
    await order.save();
    
    // Enviar email de cancelación
    this.sendCancellationEmail(order).catch(err => 
      console.error('Error sending cancellation email:', err)
    );
    
    return order;
  }
  
  /**
   * Actualiza información de tracking
   */
  public async updateTracking(
    orderId: string,
    trackingData: {
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      estimatedDelivery?: Date;
    }
  ): Promise<OrderInterface | null> {
    const order = await Order.findById(orderId);
    
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
  private async sendOrderConfirmationEmail(order: OrderInterface): Promise<void> {
    // Configurar transporter (usar las mismas credenciales que password recovery)
    const transporter = nodemailer.createTransport({
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
  private async sendStatusUpdateEmail(order: OrderInterface): Promise<void> {
    // Similar a sendOrderConfirmationEmail pero con diferentes mensajes según el estado
    console.log(`Sending status update email for order ${order.orderNumber}, status: ${order.status}`);
    // Implementar según necesidad
  }
  
  /**
   * Envía email de cancelación
   */
  private async sendCancellationEmail(order: OrderInterface): Promise<void> {
    console.log(`Sending cancellation email for order ${order.orderNumber}`);
    // Implementar según necesidad
  }
}

export default new OrderService();
