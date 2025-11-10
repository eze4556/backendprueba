import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    productTypeId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    price: number;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'cancelled' | 'expired';
    renewalDate?: Date;
    paymentMethod?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productTypeId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductType',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },
    renewalDate: {
        type: Date
    },
    paymentMethod: {
        type: String
    }
}, {
    timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1, endDate: 1 });
SubscriptionSchema.index({ productTypeId: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);