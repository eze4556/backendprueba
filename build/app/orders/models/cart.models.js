"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CartItemSchema = new mongoose_1.Schema({
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
        min: 1,
        default: 1
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
const CartSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true,
        index: true
    },
    items: [CartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, { versionKey: false });
// Middleware para calcular totales antes de guardar
CartSchema.pre('save', function (next) {
    this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
    this.totalAmount = this.items.reduce((acc, item) => acc + item.subtotal, 0);
    this.lastUpdated = new Date();
    next();
});
exports.default = (0, mongoose_1.model)('carts', CartSchema);
//# sourceMappingURL=cart.models.js.map