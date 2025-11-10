import { Schema, model, Document } from 'mongoose';

export interface IStockMovement extends Document {
    productId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    operation: 'add' | 'subtract' | 'set' | 'sale' | 'purchase' | 'adjustment';
    quantity: number;
    previousStock: number;
    finalStock: number;
    reason?: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        required: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
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

export const StockMovement = model<IStockMovement>('stock_movements', stockMovementSchema);