"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionBillingService = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("../../billing/service/billing.service");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cron = __importStar(require("node-cron"));
const logger_1 = require("../../../utils/logger");
let SubscriptionBillingService = class SubscriptionBillingService {
    constructor(billingService, subscriptionModel, logger) {
        this.billingService = billingService;
        this.subscriptionModel = subscriptionModel;
        this.logger = logger || new logger_1.Logger('SubscriptionBillingService');
        // Ejecutar cada día a las 00:01
        cron.schedule('1 0 * * *', () => {
            this.processSubscriptionBilling();
        });
    }
    // Método para procesar la facturación de suscripciones
    async processSubscriptionBilling() {
        try {
            const subscriptions = await this.subscriptionModel.find({
                isActive: true,
                endDate: {
                    $lte: new Date()
                }
            });
            this.logger.info(`Procesando ${subscriptions.length} suscripciones activas`);
            // 2. Procesar cada suscripción
            for (const subscription of subscriptions) {
                try {
                    await this.generateSubscriptionInvoice(subscription);
                }
                catch (error) {
                    this.logger.error(`Error procesando suscripción ${subscription.id}:`, {
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Error en procesamiento de facturación:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
    async generateSubscriptionInvoice(subscription) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        // 1. Crear datos para la factura
        const invoiceData = {
            providerId: subscription.providerId,
            subscriptionId: subscription.id,
            planId: subscription.planType,
            billingPeriod: {
                startDate,
                endDate
            },
            paymentMethod: subscription.paymentMethod
        };
        try {
            // 2. Generar factura
            const invoice = await this.billingService.createInvoice(invoiceData);
            // 3. Actualizar fecha de próxima facturación y datos de la suscripción
            await this.subscriptionModel.findByIdAndUpdate(subscription.id, {
                endDate: endDate,
                lastInvoiceId: invoice.id,
                $set: { 'billing.lastInvoiceDate': new Date() }
            });
            this.logger.info(`Factura generada para la suscripción ${subscription.id}`);
            return invoice;
        }
        catch (error) {
            this.logger.error(`Error generando factura para suscripción ${subscription.id}:`, {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }
    async generateManualInvoice(subscriptionId) {
        const subscription = await this.subscriptionModel.findById(subscriptionId);
        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }
        if (!subscription.isActive) {
            throw new Error('La suscripción no está activa');
        }
        return this.generateSubscriptionInvoice(subscription);
    }
};
exports.SubscriptionBillingService = SubscriptionBillingService;
exports.SubscriptionBillingService = SubscriptionBillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)('Subscription')),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        mongoose_2.Model,
        logger_1.Logger])
], SubscriptionBillingService);
//# sourceMappingURL=subscription-billing.service.js.map