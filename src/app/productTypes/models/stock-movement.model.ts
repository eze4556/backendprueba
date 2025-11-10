import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
    productId: mongoose.Types.ObjectId;
    movementType: 'add' | 'subtract' | 'set' | 'sale' | 'purchase' | 'adjustment';
    quantity: number;
    previousStock: number;
    newStock: number;
    reason?: string;
    userId: mongoose.Types.ObjectId;
    userRole: string;
    createdAt: Date;
    updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    },
    movementType: {
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
    newStock: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    userRole: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Índices para optimizar consultas
StockMovementSchema.index({ productId: 1, createdAt: -1 });
StockMovementSchema.index({ userId: 1, createdAt: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);