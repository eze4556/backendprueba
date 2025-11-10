import mongoose, { Schema, Document } from 'mongoose';
import { Invoice as IInvoice, InvoiceStatus, BillingStatus } from '../interfaces/billing.interface';

export interface IInvoiceDocument extends Document, Omit<IInvoice, 'id'> {}

const BillingInvoiceSchema = new Schema({
    id: { type: String, required: true, unique: true },
    providerId: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true, index: true },
    plan: {
        id: { type: String, required: true },
        type: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        features: [String]
    },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        required: true, 
        enum: Object.values(InvoiceStatus),
        index: true 
    },
    billingPeriod: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    createdAt: { type: Date, required: true, default: Date.now },
    paidAt: { type: Date },
    dueDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    paymentId: { type: String },
    metadata: { type: Map, of: String }
}, {
    timestamps: true
});

// Índices compuestos para consultas frecuentes
BillingInvoiceSchema.index({ providerId: 1, status: 1 });
BillingInvoiceSchema.index({ subscriptionId: 1, createdAt: -1 });
BillingInvoiceSchema.index({ dueDate: 1, status: 1 });

const BillingCycleSchema = new Schema({
    subscriptionId: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    lastBillingDate: { type: Date },
    nextBillingDate: { type: Date, required: true, index: true },
    status: { 
        type: String, 
        required: true,
        enum: Object.values(BillingStatus),
        index: true 
    },
    frequency: { 
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly'
    },
    lastInvoiceId: { type: String },
    metadata: { type: Map, of: String }
}, {
    timestamps: true
});

// Índices para BillingCycle
BillingCycleSchema.index({ nextBillingDate: 1, status: 1 });

export const BillingInvoice = mongoose.model<IInvoiceDocument>('BillingInvoice', BillingInvoiceSchema);
export const BillingCycle = mongoose.model('BillingCycle', BillingCycleSchema);