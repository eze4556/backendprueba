export interface PaymentInfo {
    invoiceId: string;
    transactionId: string;
    amount: number;
    currency: string;
    clientEmail: string;
    provider?: string;
    metadata?: Record<string, any>;
}