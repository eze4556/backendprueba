import { SubscriptionPlan } from '../../subscripcion/models/subscription-plan.model';
import mongoose, { Document } from 'mongoose';

export interface BillingCycle {
    startDate: Date;
    endDate: Date;
    lastBillingDate?: Date;
    nextBillingDate: Date;
    status: BillingStatus;
}

export enum BillingStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface Invoice {
    id: string;
    providerId: string;
    subscriptionId: string;
    plan: SubscriptionPlan;
    amount: number;
    status: InvoiceStatus;
    billingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    createdAt: Date;
    paidAt?: Date;
    dueDate: Date;
    paymentMethod: string;
    paymentId?: string;
}

export enum InvoiceStatus {
    PENDING = 'pending',
    PAID = 'paid',
    OVERDUE = 'overdue',
    CANCELLED = 'cancelled',
    FAILED = 'failed'
}

export interface CreateInvoiceDto {
    providerId: string;
    subscriptionId: string;
    planId: string;
    paymentMethod: string;
    billingPeriod: {
        startDate: Date;
        endDate: Date;
    };
}

export interface IInvoiceDocument extends Omit<Invoice, 'id'>, Document {
    _id: mongoose.Types.ObjectId;
}