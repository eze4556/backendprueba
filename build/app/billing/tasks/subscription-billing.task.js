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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionBillingTask = exports.Logger = void 0;
// src/app/billing/tasks/subscription-billing.task.ts
const cron = __importStar(require("node-cron"));
class Logger {
    constructor(context) {
        this.context = context;
    }
    info(message, ...args) {
        console.log(`[${this.context}] INFO:`, message, ...args);
    }
    error(message, ...args) {
        console.error(`[${this.context}] ERROR:`, message, ...args);
    }
    warn(message, ...args) {
        console.warn(`[${this.context}] WARN:`, message, ...args);
    }
    debug(message, ...args) {
        console.debug(`[${this.context}] DEBUG:`, message, ...args);
    }
}
exports.Logger = Logger;
class SubscriptionBillingTask {
    constructor(billingService, logger) {
        this.billingService = billingService;
        this.logger = logger || new Logger('SubscriptionBillingTask');
        // Ejecutar cada día a las 00:01
        this.cronJob = cron.schedule('1 0 * * *', async () => {
            try {
                await this.processSubscriptions();
            }
            catch (error) {
                this.logger.error('Error en el procesamiento de suscripciones programado:', error instanceof Error ? error.message : 'Error desconocido');
            }
        });
    }
    stopTask() {
        this.cronJob.stop();
        this.logger.info('Tarea de facturación detenida');
    }
    async processSubscriptions() {
        try {
            const subscriptions = await this.billingService.getActiveSubscriptions() || [];
            this.logger.info(`Procesando ${subscriptions.length} suscripciones activas`);
            for (const subscription of subscriptions) {
                await this.processSubscription(subscription);
            }
            this.logger.info('Procesamiento de suscripciones completado');
        }
        catch (error) {
            this.logger.error('Error al procesar las suscripciones:', error instanceof Error ? error.message : 'Error desconocido');
            throw error;
        }
    }
    async processSubscription(subscription) {
        try {
            if (!this.isValidSubscription(subscription)) {
                this.logger.warn(`Suscripción inválida encontrada para el usuario ${subscription.providerId}`);
                return;
            }
            if (await this.shouldGenerateInvoice(subscription)) {
                const invoiceData = this.createInvoiceData(subscription);
                await this.billingService.createInvoice(invoiceData);
                this.logger.info(`Factura generada para el proveedor ${subscription.providerId}`);
            }
        }
        catch (error) {
            this.logger.error(`Error al procesar la suscripción ${subscription.providerId}:`, error instanceof Error ? error.message : 'Error desconocido');
            throw error instanceof Error ? error : new Error('Error al procesar suscripción');
        }
    }
    calculateBillingPeriod(subscription) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30); // Periodo de facturación de 30 días
        return { startDate, endDate };
    }
    isValidSubscription(subscription) {
        return Boolean(subscription &&
            subscription.providerId &&
            subscription.planType &&
            subscription.isActive);
    }
    async shouldGenerateInvoice(subscription) {
        try {
            const billingCycle = await this.billingService.getBillingCycle(subscription.id);
            if (!billingCycle) {
                return true; // Primera factura
            }
            return new Date() >= new Date(billingCycle.nextBillingDate);
        }
        catch (error) {
            this.logger.error(`Error al verificar ciclo de facturación:`, error instanceof Error ? error.message : 'Error desconocido');
            return false;
        }
    }
    createInvoiceData(subscription) {
        const billingPeriod = this.calculateBillingPeriod(subscription);
        return {
            providerId: subscription.providerId,
            subscriptionId: subscription.id,
            planId: subscription.planType,
            billingPeriod,
            paymentMethod: subscription.paymentMethod || 'default'
        };
    }
}
exports.SubscriptionBillingTask = SubscriptionBillingTask;
//# sourceMappingURL=subscription-billing.task.js.map