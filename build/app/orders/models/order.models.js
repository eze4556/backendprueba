"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingMethod = exports.PaymentStatus = exports.OrderStatus = void 0;
const mongoose_1 = require("mongoose");
// Enums para estados de orden
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["PREPARING"] = "preparing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["IN_TRANSIT"] = "in_transit";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["REFUNDED"] = "refunded";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["APPROVED"] = "approved";
    PaymentStatus["REJECTED"] = "rejected";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ShippingMethod;
(function (ShippingMethod) {
    ShippingMethod["STANDARD"] = "standard";
    ShippingMethod["EXPRESS"] = "express";
    ShippingMethod["PICKUP"] = "pickup";
})(ShippingMethod || (exports.ShippingMethod = ShippingMethod = {}));
// Schema para items
const OrderItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }
}, { _id: false });
// Schema para dirección
const AddressSchema = new mongoose_1.Schema({
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
const PaymentInfoSchema = new mongoose_1.Schema({
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
const ShippingTrackingSchema = new mongoose_1.Schema({
    carrier: { type: String, required: false },
    trackingNumber: { type: String, required: false },
    trackingUrl: { type: String, required: false },
    estimatedDelivery: { type: Date, required: false },
    shippedDate: { type: Date, required: false },
    deliveredDate: { type: Date, required: false }
}, { _id: false });
// Schema principal de Order
const OrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
        // Nota: index se define con .index() al final del schema para evitar duplicados
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: {
            validator: function (items) {
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
        default: function () {
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
        type: mongoose_1.Schema.Types.ObjectId,
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
OrderSchema.statics.generateOrderNumber = async function () {
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
exports.default = (0, mongoose_1.model)('orders', OrderSchema);
//# sourceMappingURL=order.models.js.map