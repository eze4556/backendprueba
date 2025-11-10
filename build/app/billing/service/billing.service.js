"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const mongoose_1 = __importDefault(require("mongoose"));
const billing_interface_1 = require("../interfaces/billing.interface");
const payment_service_1 = __importDefault(require("../../payment/services/payment.service"));
const subscription_service_1 = require("../../subscripcion/service/subscription.service");
const provider_service_1 = require("../../proveedores/servicio/provider.service");
const billing_model_1 = require("../models/billing.model");
const logger_1 = require("../../../utils/logger");
let BillingService = class BillingService {
    constructor(paymentService, subscriptionService, providerService, logger) {
        this.paymentService = paymentService;
        this.subscriptionService = subscriptionService;
        this.providerService = providerService;
        this.logger = logger || new logger_1.Logger('BillingService');
    }
    async getActiveSubscriptions() {
        try {
            const subscriptions = await this.subscriptionService.getProviderSubscriptions('*');
            return subscriptions.filter(sub => sub.isActive);
        }
        catch (error) {
            this.logger.error('Error al obtener suscripciones activas:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    async createInvoice(data) {
        const session = await billing_model_1.BillingInvoice.startSession();
        session.startTransaction();
        try {
            const { providerId, subscriptionId, planId, billingPeriod, paymentMethod } = data;
            // Verificar proveedor
            const provider = await this.providerService.getProviderById(providerId);
            if (!provider) {
                throw new Error('Proveedor no encontrado');
            }
            // Verificar suscripción y obtener detalles del plan
            const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
            if (!subscription) {
                throw new Error('Suscripción no encontrada');
            }
            if (!subscription.isActive) {
                throw new Error('La suscripción no está activa');
            }
            const plan = await this.subscriptionService.getPlanDetails(planId);
            if (!plan) {
                throw new Error('Plan no encontrado');
            }
            // Validar fechas del periodo de facturación
            if (new Date(billingPeriod.startDate) > new Date(billingPeriod.endDate)) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }
            // Crear factura en la base de datos
            const invoiceDoc = await billing_model_1.BillingInvoice.create({
                providerId,
                subscriptionId,
                plan,
                amount: plan.price,
                status: billing_interface_1.InvoiceStatus.PENDING,
                billingPeriod,
                paymentMethod,
                createdAt: new Date(),
                dueDate: new Date(billingPeriod.endDate),
                paidAt: null,
                currency: 'USD', // O la moneda que corresponda
                description: `Factura de suscripción - Período ${new Date(billingPeriod.startDate).toLocaleDateString()} al ${new Date(billingPeriod.endDate).toLocaleDateString()}`
            });
            // Actualizar ciclo de facturación dentro de la transacción
            await this.updateBillingCycle(subscriptionId, billingPeriod, session);
            await session.commitTransaction();
            // Convertir el documento a la interfaz Invoice
            const invoice = {
                id: invoiceDoc._id.toString(),
                providerId: invoiceDoc.providerId,
                subscriptionId: invoiceDoc.subscriptionId,
                plan: invoiceDoc.plan,
                amount: invoiceDoc.amount,
                status: invoiceDoc.status,
                billingPeriod: invoiceDoc.billingPeriod,
                createdAt: invoiceDoc.createdAt,
                dueDate: invoiceDoc.dueDate,
                paidAt: invoiceDoc.paidAt,
                paymentMethod: invoiceDoc.paymentMethod,
                paymentId: invoiceDoc.paymentId,
            };
            return invoice;
        }
        catch (error) {
            this.logger.error('Error al crear factura:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    async getBillingCycle(subscriptionId) {
        try {
            return await billing_model_1.BillingCycle.findOne({ subscriptionId });
        }
        catch (error) {
            this.logger.error('Error al obtener ciclo de facturación:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    async processPayment(invoice) {
        try {
            const paymentResult = await this.paymentService.authorizePayment(invoice.paymentMethod, {
                amount: invoice.amount,
                currency: 'USD', // Moneda por defecto
                invoiceId: invoice.id,
                providerId: invoice.providerId,
                description: `Pago de factura ${invoice.id}`
            }, invoice.amount);
            if (paymentResult.success) {
                await this.updateInvoiceStatus(invoice.id, billing_interface_1.InvoiceStatus.PAID, paymentResult.paymentId);
            }
            else {
                await this.updateInvoiceStatus(invoice.id, billing_interface_1.InvoiceStatus.FAILED);
            }
            return paymentResult;
        }
        catch (error) {
            this.logger.error('Error al procesar el pago:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            await this.updateInvoiceStatus(invoice.id, billing_interface_1.InvoiceStatus.FAILED);
            throw error;
        }
    }
    async updateBillingCycle(subscriptionId, billingPeriod, session) {
        try {
            const nextBillingDate = new Date(billingPeriod.endDate);
            nextBillingDate.setDate(nextBillingDate.getDate() + 1);
            const updateOperation = billing_model_1.BillingCycle.findOneAndUpdate({ subscriptionId }, {
                subscriptionId,
                currentPeriod: billingPeriod,
                nextBillingDate,
                updatedAt: new Date()
            }, {
                upsert: true,
                new: true // Retorna el documento actualizado
            });
        }
        catch (error) {
            this.logger.error('Error al actualizar ciclo de facturación:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    async updateInvoiceStatus(invoiceId, status, paymentId) {
        try {
            const updateData = {
                status,
                updatedAt: new Date()
            };
            if (status === billing_interface_1.InvoiceStatus.PAID) {
                updateData.paidAt = new Date();
                if (paymentId) {
                    updateData.paymentId = paymentId;
                }
            }
            await billing_model_1.BillingInvoice.findByIdAndUpdate(invoiceId, updateData);
        }
        catch (error) {
            this.logger.error('Error al actualizar estado de factura:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    async handleWebhookPayment(paymentData) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const invoiceDoc = await billing_model_1.BillingInvoice.findById(paymentData.invoiceId).session(session);
            if (!invoiceDoc) {
                throw new Error(`Factura no encontrada: ${paymentData.invoiceId}`);
            }
            if (invoiceDoc.amount !== paymentData.amount) {
                this.logger.warn('Monto del pago diferente al de la factura', {
                    invoiceAmount: invoiceDoc.amount,
                    paymentAmount: paymentData.amount
                });
            }
            // Actualizar estado y datos del pago
            const updateResult = await billing_model_1.BillingInvoice.findByIdAndUpdate(invoiceDoc._id, {
                status: billing_interface_1.InvoiceStatus.PAID,
                paidAt: new Date(),
                paymentId: paymentData.transactionId,
                paymentProvider: paymentData.provider,
                paymentMetadata: paymentData.metadata,
                updatedAt: new Date()
            }, { session, new: true });
            if (!updateResult) {
                throw new Error('Error al actualizar la factura con los datos del pago');
            }
            await session.commitTransaction();
            this.logger.info(`Pago procesado para factura ${invoiceDoc._id}`, {
                transactionId: paymentData.transactionId,
                provider: paymentData.provider
            });
        }
        catch (error) {
            this.logger.error('Error al procesar pago del webhook:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payment_service_1.default,
        subscription_service_1.SubscriptionService,
        provider_service_1.ProviderService,
        logger_1.Logger])
], BillingService);
//# sourceMappingURL=billing.service.js.map