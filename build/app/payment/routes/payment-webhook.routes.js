"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_webhook_controller_1 = require("../controllers/payment-webhook.controller");
const payment_service_1 = __importDefault(require("../services/payment.service"));
const billing_service_1 = require("../../billing/service/billing.service");
const subscription_service_1 = require("../../subscripcion/service/subscription.service");
const provider_service_1 = require("../../proveedores/servicio/provider.service");
const logger_1 = require("../../../utils/logger");
const router = (0, express_1.Router)();
const logger = new logger_1.Logger('PaymentWebhook');
const paymentService = new payment_service_1.default();
const subscriptionService = new subscription_service_1.SubscriptionService();
const providerService = new provider_service_1.ProviderService();
const billingService = new billing_service_1.BillingService(paymentService, subscriptionService, providerService, logger);
const webhookController = new payment_webhook_controller_1.PaymentWebhookController(paymentService, billingService);
// Webhooks para diferentes proveedores de pago
router.post('/webhook/paypal', (req, res) => webhookController.handlePayPalWebhook(req, res));
router.post('/webhook/stripe', (req, res) => webhookController.handleStripeWebhook(req, res));
exports.default = router;
//# sourceMappingURL=payment-webhook.routes.js.map