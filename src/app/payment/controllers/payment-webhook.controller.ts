import { Request, Response, Router } from 'express';
import PaymentService from '../services/payment.service';
import { BillingService } from '../../billing/service/billing.service';
import { Logger } from '../../../utils/logger';
import { PaymentInfo } from '../interfaces/payment-info.interface';
import { InvoiceStatus } from '../../billing/interfaces/billing.interface';
import { SubscriptionService } from '../../subscripcion/service/subscription.service';
import { ProviderService } from '../../proveedores/servicio/provider.service';

export enum PaymentProvider {
    PAYPAL = 'PAYPAL',
    STRIPE = 'STRIPE'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

// Crear instancia del router
const router = Router();

export class PaymentWebhookController {
    private readonly logger: Logger;

    constructor(
        private readonly paymentService: PaymentService,
        private readonly billingService: BillingService
    ) {
        this.logger = new Logger('PaymentWebhookController');
    }

    // Webhook para PayPal
    async handlePayPalWebhook(req: Request, res: Response) {
        try {
            const event = req.body;
            this.logger.info('PayPal webhook received:', event);

            if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
                await this.handleSuccessfulPayment(PaymentProvider.PAYPAL, event);
            }

            res.status(200).send('OK');
        } catch (error) {
            this.logger.error('Error processing PayPal webhook:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            res.status(500).send('Error processing webhook');
        }
    }

    // Webhook para Stripe
    async handleStripeWebhook(req: Request, res: Response) {
        try {
            const event = req.body;
            this.logger.info('Stripe webhook received:', event);

            if (event.type === 'payment_intent.succeeded') {
                await this.handleSuccessfulPayment(PaymentProvider.STRIPE, event);
            }

            res.status(200).send('OK');
        } catch (error) {
            this.logger.error('Error processing Stripe webhook:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            res.status(500).send('Error processing webhook');
        }
    }

    private async handleSuccessfulPayment(provider: PaymentProvider, event: any) {
        try {
            // Extraer información relevante del evento según el proveedor
            const paymentInfo = this.extractPaymentInfo(provider, event);
            
            // Validar la información del pago
            if (!this.validatePaymentInfo(paymentInfo)) {
                throw new Error('Información de pago inválida o incompleta');
            }

            // Procesar el pago en el BillingService
            await this.billingService.handleWebhookPayment({
                invoiceId: paymentInfo.invoiceId,
                amount: paymentInfo.amount,
                currency: paymentInfo.currency,
                transactionId: paymentInfo.transactionId,
                provider: provider,
                status: PaymentStatus.PAID,
                metadata: {
                    clientEmail: paymentInfo.clientEmail,
                    ...paymentInfo.metadata
                }
            });

            // Notificar al cliente
            await this.notifyClient(paymentInfo);

            this.logger.info(`Payment processed successfully for invoice ${paymentInfo.invoiceId}`);
        } catch (error) {
            this.logger.error('Error handling successful payment:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    private extractPaymentInfo(provider: PaymentProvider, event: any): PaymentInfo {
        try {
            switch (provider) {
                case PaymentProvider.PAYPAL:
                    if (!event.resource?.custom_id || !event.resource?.id) {
                        throw new Error('Información de PayPal incompleta');
                    }
                    return {
                        invoiceId: event.resource.custom_id,
                        transactionId: event.resource.id,
                        amount: parseFloat(event.resource.amount.value),
                        currency: event.resource.amount.currency_code,
                        clientEmail: event.resource.payer.email_address,
                        provider: PaymentProvider.PAYPAL,
                        metadata: {
                            paypalOrderId: event.resource.id,
                            paymentStatus: event.resource.status
                        }
                    };
                case PaymentProvider.STRIPE:
                    if (!event.data?.object?.metadata?.invoice_id || !event.data?.object?.id) {
                        throw new Error('Información de Stripe incompleta');
                    }
                    return {
                        invoiceId: event.data.object.metadata.invoice_id,
                        transactionId: event.data.object.id,
                        amount: event.data.object.amount / 100, // Stripe usa centavos
                        currency: event.data.object.currency,
                        clientEmail: event.data.object.receipt_email,
                        provider: PaymentProvider.STRIPE,
                        metadata: {
                            paymentIntentId: event.data.object.id,
                            paymentMethod: event.data.object.payment_method_types
                        }
                    };
                default:
                    throw new Error(`Proveedor de pago no soportado: ${provider}`);
            }
        } catch (error) {
            this.logger.error(`Error extracting payment info for provider ${provider}:`, {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    private validatePaymentInfo(paymentInfo: PaymentInfo): boolean {
        return Boolean(
            paymentInfo &&
            paymentInfo.invoiceId &&
            paymentInfo.transactionId &&
            paymentInfo.amount > 0 &&
            paymentInfo.currency &&
            paymentInfo.clientEmail
        );
    }

    private async notifyClient(paymentInfo: PaymentInfo): Promise<void> {
        try {
            // TODO: Implementar sistema de notificaciones
            // Por ejemplo: Email, SMS, Push Notification
            this.logger.info('Payment notification prepared', {
                clientEmail: paymentInfo.clientEmail,
                invoiceId: paymentInfo.invoiceId,
                amount: paymentInfo.amount,
                currency: paymentInfo.currency
            });
        } catch (error) {
            this.logger.error('Error sending payment notification:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            // No lanzamos el error para no afectar el flujo principal
        }
    }
}

// Inicializar servicios
const paymentService = new PaymentService();
const billingService = new BillingService(
    paymentService,
    new SubscriptionService(),
    new ProviderService(),
    new Logger('PaymentWebhook')
);
const webhookController = new PaymentWebhookController(paymentService, billingService);

// Configurar rutas de webhooks
router.post('/paypal', (req: Request, res: Response) => webhookController.handlePayPalWebhook(req, res));
router.post('/stripe', (req: Request, res: Response) => webhookController.handleStripeWebhook(req, res));

export const paymentWebhookRoutes = router;
