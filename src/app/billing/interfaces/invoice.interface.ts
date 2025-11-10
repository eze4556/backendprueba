import { Document } from 'mongoose';
import { SubscriptionPlan } from '../../subscripcion/models/subscription-plan.model';

export interface IInvoiceDocument extends Document {
    providerId: string;
    subscriptionId: string;
    plan: SubscriptionPlan;
    amount: number;
    status: string;
    billingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    paymentMethod: string;
    paymentId?: string;
    paymentProvider?: string;
    paymentMetadata?: Record<string, any>;
    currency: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    dueDate: Date;
    paidAt?: Date;
}