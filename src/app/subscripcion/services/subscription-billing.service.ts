import { Injectable } from '@nestjs/common';
import { BillingService } from '../../billing/service/billing.service';
import { SubscriptionData } from '../models/suscription.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateInvoiceDto } from '../../billing/interfaces/billing.interface';
import * as cron from 'node-cron';
import { Logger } from '../../../utils/logger';

@Injectable()
export class SubscriptionBillingService {
  private readonly logger: Logger;

  constructor(
    private billingService: BillingService,
    @InjectModel('Subscription') private readonly subscriptionModel: Model<SubscriptionData>,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('SubscriptionBillingService');
    
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
        } catch (error) {
          this.logger.error(
            `Error procesando suscripción ${subscription.id}:`, {
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
    } catch (error) {
      this.logger.error(
        'Error en procesamiento de facturación:', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  private async generateSubscriptionInvoice(subscription: SubscriptionData) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // 1. Crear datos para la factura
    const invoiceData: CreateInvoiceDto = {
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
    } catch (error) {
      this.logger.error(
        `Error generando factura para suscripción ${subscription.id}:`, {
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  async generateManualInvoice(subscriptionId: string) {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }

    if (!subscription.isActive) {
      throw new Error('La suscripción no está activa');
    }

    return this.generateSubscriptionInvoice(subscription);
  }
}