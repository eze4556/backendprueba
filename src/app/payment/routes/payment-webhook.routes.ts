import { Router } from 'express';
import { PaymentWebhookController } from '../controllers/payment-webhook.controller';
import PaymentService from '../services/payment.service';
import { BillingService } from '../../billing/service/billing.service';
import { SubscriptionService } from '../../subscripcion/service/subscription.service';
import { ProviderService } from '../../proveedores/servicio/provider.service';
import { Logger } from '../../../utils/logger';

const router = Router();
const logger = new Logger('PaymentWebhook');
const paymentService = new PaymentService();
const subscriptionService = new SubscriptionService();
const providerService = new ProviderService();
const billingService = new BillingService(paymentService, subscriptionService, providerService, logger);
const webhookController = new PaymentWebhookController(paymentService, billingService);

// Webhooks para diferentes proveedores de pago
router.post('/webhook/paypal', (req, res) => webhookController.handlePayPalWebhook(req, res));
router.post('/webhook/stripe', (req, res) => webhookController.handleStripeWebhook(req, res));

export default router;