"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovement = void 0;
const mongoose_1 = require("mongoose");
const stockMovementSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'products',
        required: true,
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    operation: {
        type: String,
        enum: ['add', 'subtract', 'set', 'sale', 'purchase', 'adjustment'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    previousStock: {
        type: Number,
        required: true
    },
    finalStock: {
        type: Number,
        required: true
    },
    reason: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});
// Índices
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ userId: 1 });
stockMovementSchema.index({ status: 1 });
exports.StockMovement = (0, mongoose_1.model)('stock_movements', stockMovementSchema);
//# sourceMappingURL=stock.models.js.map