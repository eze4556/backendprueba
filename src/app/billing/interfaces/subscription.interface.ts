export type SubscriptionPlan = 'bronce' | 'plata' | 'gold';

export interface Subscription {
    userId: string;
    plan: SubscriptionPlan;
    status: 'active' | 'inactive' | 'suspended';
    lastInvoiceDate?: Date;
    billingCycleDays: number;
    nextBillingDate?: Date;
}

export interface InvoiceData {
    userId: string;
    subscriptionMonth: string;
    plan: SubscriptionPlan;
    invoiceType: number;
    pointOfSale: number;
}