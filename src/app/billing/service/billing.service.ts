import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import mongoose from 'mongoose';
import { BillingCycle, CreateInvoiceDto, Invoice, InvoiceStatus, IInvoiceDocument } from '../interfaces/billing.interface';
import PaymentService from '../../payment/services/payment.service';
import { PaymentResult, PaymentProvider } from '../../payment/interfaces/payment.interface';
import { SubscriptionService } from '../../subscripcion/service/subscription.service';
import { PlanType } from '../../subscripcion/models/suscription.model';
import { ProviderService } from '../../proveedores/servicio/provider.service';
import { SubscriptionData } from '../../subscripcion/models/suscription.model';
import { BillingInvoice as InvoiceModel, BillingCycle as BillingCycleModel } from '../models/billing.model';
import { Logger } from '../../../utils/logger';

@Injectable()
export class BillingService {
    private readonly logger: Logger;
    
    constructor(
        private readonly paymentService: PaymentService,
        private readonly subscriptionService: SubscriptionService,
        private readonly providerService: ProviderService,
        logger?: Logger
    ) {
        this.logger = logger || new Logger('BillingService');
    }

    public async getActiveSubscriptions(): Promise<SubscriptionData[]> {
        try {
            const subscriptions = await this.subscriptionService.getProviderSubscriptions('*');
            return subscriptions.filter(sub => sub.isActive);
        } catch (error) {
            this.logger.error('Error al obtener suscripciones activas:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    public async createInvoice(data: CreateInvoiceDto): Promise<Invoice> {
        const session = await InvoiceModel.startSession();
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

            const plan = await this.subscriptionService.getPlanDetails(planId as PlanType);
            if (!plan) {
                throw new Error('Plan no encontrado');
            }

            // Validar fechas del periodo de facturación
            if (new Date(billingPeriod.startDate) > new Date(billingPeriod.endDate)) {
                throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
            }

            // Crear factura en la base de datos
            const invoiceDoc = await InvoiceModel.create({
                providerId,
                subscriptionId,
                plan,
                amount: plan.price,
                status: InvoiceStatus.PENDING,
                billingPeriod,
                paymentMethod,
                createdAt: new Date(),
                dueDate: new Date(billingPeriod.endDate),
                paidAt: null,
                currency: 'USD', // O la moneda que corresponda
                description: `Factura de suscripción - Período ${new Date(billingPeriod.startDate).toLocaleDateString()} al ${new Date(billingPeriod.endDate).toLocaleDateString()}`
            }) as IInvoiceDocument;

            // Actualizar ciclo de facturación dentro de la transacción
            await this.updateBillingCycle(subscriptionId, billingPeriod, session);

            await session.commitTransaction();

            // Convertir el documento a la interfaz Invoice
            const invoice: Invoice = {
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
        } catch (error) {
            this.logger.error('Error al crear factura:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    public async getBillingCycle(subscriptionId: string): Promise<BillingCycle | null> {
        try {
            return await BillingCycleModel.findOne({ subscriptionId });
        } catch (error) {
            this.logger.error('Error al obtener ciclo de facturación:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    public async processPayment(invoice: Invoice): Promise<PaymentResult> {
        try {
            const paymentResult = await this.paymentService.authorizePayment(
                invoice.paymentMethod,
                {
                    amount: invoice.amount,
                    currency: 'USD', // Moneda por defecto
                    invoiceId: invoice.id,
                    providerId: invoice.providerId,
                    description: `Pago de factura ${invoice.id}`
                },
                invoice.amount
            );

            if (paymentResult.success) {
                await this.updateInvoiceStatus(invoice.id, InvoiceStatus.PAID, paymentResult.paymentId);
            } else {
                await this.updateInvoiceStatus(invoice.id, InvoiceStatus.FAILED);
            }

            return paymentResult;
        } catch (error) {
            this.logger.error('Error al procesar el pago:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            await this.updateInvoiceStatus(invoice.id, InvoiceStatus.FAILED);
            throw error;
        }
    }

    private async updateBillingCycle(
        subscriptionId: string, 
        billingPeriod: { startDate: Date; endDate: Date },
        session?: mongoose.ClientSession
    ): Promise<void> {
        try {
            const nextBillingDate = new Date(billingPeriod.endDate);
            nextBillingDate.setDate(nextBillingDate.getDate() + 1);

            const updateOperation = BillingCycleModel.findOneAndUpdate(
                { subscriptionId },
                {
                    subscriptionId,
                    currentPeriod: billingPeriod,
                    nextBillingDate,
                    updatedAt: new Date()
                },
                { 
                    upsert: true,
                    new: true // Retorna el documento actualizado
                }
            );
        } catch (error) {
            this.logger.error('Error al actualizar ciclo de facturación:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    private async updateInvoiceStatus(
        invoiceId: string,
        status: InvoiceStatus,
        paymentId?: string
    ): Promise<void> {
        try {
            const updateData: any = {
                status,
                updatedAt: new Date()
            };

            if (status === InvoiceStatus.PAID) {
                updateData.paidAt = new Date();
                if (paymentId) {
                    updateData.paymentId = paymentId;
                }
            }

            await InvoiceModel.findByIdAndUpdate(invoiceId, updateData);
        } catch (error) {
            this.logger.error('Error al actualizar estado de factura:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    }

    public async handleWebhookPayment(paymentData: {
        invoiceId: string;
        amount: number;
        currency: string;
        transactionId: string;
        provider: string;
        status: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const invoiceDoc = await InvoiceModel.findById(paymentData.invoiceId).session(session);
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
            const updateResult = await InvoiceModel.findByIdAndUpdate(
                invoiceDoc._id,
                {
                    status: InvoiceStatus.PAID,
                    paidAt: new Date(),
                    paymentId: paymentData.transactionId,
                    paymentProvider: paymentData.provider,
                    paymentMetadata: paymentData.metadata,
                    updatedAt: new Date()
                },
                { session, new: true }
            );

            if (!updateResult) {
                throw new Error('Error al actualizar la factura con los datos del pago');
            }

            await session.commitTransaction();

            this.logger.info(`Pago procesado para factura ${invoiceDoc._id}`, {
                transactionId: paymentData.transactionId,
                provider: paymentData.provider
            });
        } catch (error) {
            this.logger.error('Error al procesar pago del webhook:', {
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
