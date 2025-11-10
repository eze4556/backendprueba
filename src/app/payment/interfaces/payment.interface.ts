export enum PaymentProvider {
    PAYPAL = 'paypal',
    STRIPE = 'stripe',
    PERSONAL_PAY = 'personalPay',
    BINANCE = 'binance',
    PREX = 'prex',
    PAYONEER = 'payoneer',
    RIPIO = 'ripio',
    TARJETA = 'tarjeta'
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    metodo: string;
    monto: number;
    message: string;
    error?: {
        code: string;
        message: string;
    };
}

export interface PaymentData {
    // Datos comunes
    amount: number;
    currency: string;
    description?: string;
    
    // Identificadores
    invoiceId?: string;
    providerId?: string;

    // Datos de tarjeta
    cardNumber?: string;
    cvv?: string;
    expiryDate?: string;
    cardholderName?: string;

    // Tokens de pago
    token?: string;
    paymentMethodId?: string;

    // PayPal
    paypalOrderId?: string;

    // Crypto
    walletAddress?: string;
    cryptoCurrency?: string;

    // Datos adicionales
    metadata?: Record<string, unknown>;
}

export interface PaymentWebhookEvent {
    provider: PaymentProvider;
    event_type: string;
    resource: {
        id: string;
        custom_id?: string;
        amount: {
            value: number;
            currency_code: string;
        };
        payer?: {
            email_address: string;
        };
        metadata?: {
            invoice_id: string;
        };
        receipt_email?: string;
    };
}