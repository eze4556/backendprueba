import mongoose, { Schema, model } from 'mongoose';

// Enums para estados de orden
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

export enum ShippingMethod {
  STANDARD = 'standard',
  EXPRESS = 'express',
  PICKUP = 'pickup'
}

// Interfaz para items de la orden
export interface OrderItemInterface {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
  providerId: mongoose.Types.ObjectId;
}

// Interfaz para dirección de envío
export interface ShippingAddressInterface {
  fullName: string;
  phone: string;
  streetName: string;
  streetNumber: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  additionalInfo?: string;
}

// Interfaz para información de pago
export interface PaymentInfoInterface {
  method: string; // 'mercadopago', 'paypal', 'transfer', etc.
  status: PaymentStatus;
  transactionId?: string;
  preferenceId?: string;
  paymentDate?: Date;
  amount: number;
}

// Interfaz para tracking de envío
export interface ShippingTrackingInterface {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippedDate?: Date;
  deliveredDate?: Date;
}

// Interfaz principal de Order
export interface OrderInterface extends mongoose.Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  items: OrderItemInterface[];
  
  // Totales
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
  
  // Estado
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    date: Date;
    note?: string;
  }>;
  
  // Envío
  shippingMethod: ShippingMethod;
  shippingAddress: ShippingAddressInterface;
  shippingTracking?: ShippingTrackingInterface;
  
  // Pago
  paymentInfo: PaymentInfoInterface;
  
  // Facturación
  billingAddress?: ShippingAddressInterface;
  invoiceRequired: boolean;
  invoiceUrl?: string;
  
  // Notas
  customerNotes?: string;
  internalNotes?: string;
  
  // Cancelación
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Schema para items
const OrderItemSchema = new Schema<OrderItemInterface>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'products',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: false
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, { _id: false });

// Schema para dirección
const AddressSchema = new Schema<ShippingAddressInterface>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  streetName: { type: String, required: true },
  streetNumber: { type: String, required: true },
  apartment: { type: String, required: false },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Argentina' },
  additionalInfo: { type: String, required: false }
}, { _id: false });

// Schema para información de pago
const PaymentInfoSchema = new Schema<PaymentInfoInterface>({
  method: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  },
  transactionId: { type: String, required: false },
  preferenceId: { type: String, required: false },
  paymentDate: { type: Date, required: false },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false });

// Schema para tracking
const ShippingTrackingSchema = new Schema<ShippingTrackingInterface>({
  carrier: { type: String, required: false },
  trackingNumber: { type: String, required: false },
  trackingUrl: { type: String, required: false },
  estimatedDelivery: { type: Date, required: false },
  shippedDate: { type: Date, required: false },
  deliveredDate: { type: Date, required: false }
}, { _id: false });

// Schema principal de Order
const OrderSchema = new Schema<OrderInterface>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
    // Nota: index se define con .index() al final del schema para evitar duplicados
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: function(items: OrderItemInterface[]) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  
  // Totales
  subtotal: { type: Number, required: true, min: 0 },
  shippingCost: { type: Number, required: true, min: 0, default: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  discount: { type: Number, required: false, min: 0, default: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  
  // Estado
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    required: true
  },
  statusHistory: {
    type: [{
      status: { 
        type: String, 
        enum: Object.values(OrderStatus), 
        required: true 
      },
      date: { type: Date, default: Date.now },
      note: { type: String, required: false }
    }],
    default: function() {
      return [{
        status: OrderStatus.PENDING,
        date: new Date()
      }];
    }
  },
  
  // Envío
  shippingMethod: {
    type: String,
    enum: Object.values(ShippingMethod),
    required: true
  },
  shippingAddress: {
    type: AddressSchema,
    required: true
  },
  shippingTracking: {
    type: ShippingTrackingSchema,
    required: false
  },
  
  // Pago
  paymentInfo: {
    type: PaymentInfoSchema,
    required: true
  },
  
  // Facturación
  billingAddress: {
    type: AddressSchema,
    required: false
  },
  invoiceRequired: {
    type: Boolean,
    default: false
  },
  invoiceUrl: {
    type: String,
    required: false
  },
  
  // Notas
  customerNotes: { type: String, required: false },
  internalNotes: { type: String, required: false },
  
  // Cancelación
  cancellationReason: { type: String, required: false },
  cancelledAt: { type: Date, required: false },
  cancelledBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'users', 
    required: false 
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para búsquedas eficientes
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ 'paymentInfo.status': 1 });
// Nota: orderNumber ya tiene índice unique en la definición del campo

// Método para generar número de orden
OrderSchema.statics.generateOrderNumber = async function(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const prefix = `ORD-${year}${month}${day}`;
  
  // Buscar el último número de orden del día
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^${prefix}`)
  }).sort({ orderNumber: -1 });
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

export default model<OrderInterface>('orders', OrderSchema);
