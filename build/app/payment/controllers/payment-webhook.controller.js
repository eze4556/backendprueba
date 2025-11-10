"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentWebhookRoutes = exports.PaymentWebhookController = exports.PaymentStatus = exports.PaymentProvider = void 0;
const express_1 = require("express");
const payment_service_1 = __importDefault(require("../services/payment.service"));
const billing_service_1 = require("../../billing/service/billing.service");
const logger_1 = require("../../../utils/logger");
const subscription_service_1 = require("../../subscripcion/service/subscription.service");
const provider_service_1 = require("../../proveedores/servicio/provider.service");
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYPAL"] = "PAYPAL";
    PaymentProvider["STRIPE"] = "STRIPE";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
// Crear instancia del router
const router = (0, express_1.Router)();
class PaymentWebhookController {
    constructor(paymentService, billingService) {
        this.paymentService = paymentService;
        this.billingService = billingService;
        this.logger = new logger_1.Logger('PaymentWebhookController');
    }
    // Webhook para PayPal
    async handlePayPalWebhook(req, res) {
        try {
            const event = req.body;
            this.logger.info('PayPal webhook received:', event);
            if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
                await this.handleSuccessfulPayment(PaymentProvider.PAYPAL, event);
            }
            res.status(200).send('OK');
        }
        catch (error) {
            this.logger.error('Error processing PayPal webhook:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            res.status(500).send('Error processing webhook');
        }
    }
    // Webhook para Stripe
    async handleStripeWebhook(req, res) {
        try {
            const event = req.body;
            this.logger.info('Stripe webhook received:', event);
            if (event.type === 'payment_intent.succeeded') {
                await this.handleSuccessfulPayment(PaymentProvider.STRIPE, event);
            }
            res.status(200).send('OK');
        }
        catch (error) {
            this.logger.error('Error processing Stripe webhook:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            res.status(500).send('Error processing webhook');
        }
    }
    async handleSuccessfulPayment(provider, event) {
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
        }
        catch (error) {
            this.logger.error('Error handling successful payment:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    extractPaymentInfo(provider, event) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            switch (provider) {
                case PaymentProvider.PAYPAL:
                    if (!((_a = event.resource) === null || _a === void 0 ? void 0 : _a.custom_id) || !((_b = event.resource) === null || _b === void 0 ? void 0 : _b.id)) {
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
                    if (!((_e = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.object) === null || _d === void 0 ? void 0 : _d.metadata) === null || _e === void 0 ? void 0 : _e.invoice_id) || !((_g = (_f = event.data) === null || _f === void 0 ? void 0 : _f.object) === null || _g === void 0 ? void 0 : _g.id)) {
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
        }
        catch (error) {
            this.logger.error(`Error extracting payment info for provider ${provider}:`, {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    validatePaymentInfo(paymentInfo) {
        return Boolean(paymentInfo &&
            paymentInfo.invoiceId &&
            paymentInfo.transactionId &&
            paymentInfo.amount > 0 &&
            paymentInfo.currency &&
            paymentInfo.clientEmail);
    }
    async notifyClient(paymentInfo) {
        try {
            // TODO: Implementar sistema de notificaciones
            // Por ejemplo: Email, SMS, Push Notification
            this.logger.info('Payment notification prepared', {
                clientEmail: paymentInfo.clientEmail,
                invoiceId: paymentInfo.invoiceId,
                amount: paymentInfo.amount,
                currency: paymentInfo.currency
            });
        }
        catch (error) {
            this.logger.error('Error sending payment notification:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            // No lanzamos el error para no afectar el flujo principal
        }
    }
}
exports.PaymentWebhookController = PaymentWebhookController;
// Inicializar servicios
const paymentService = new payment_service_1.default();
const billingService = new billing_service_1.BillingService(paymentService, new subscription_service_1.SubscriptionService(), new provider_service_1.ProviderService(), new logger_1.Logger('PaymentWebhook'));
const webhookController = new PaymentWebhookController(paymentService, billingService);
// Configurar rutas de webhooks
router.post('/paypal', (req, res) => webhookController.handlePayPalWebhook(req, res));
router.post('/stripe', (req, res) => webhookController.handleStripeWebhook(req, res));
exports.paymentWebhookRoutes = router;
//# sourceMappingURL=payment-webhook.controller.js.map