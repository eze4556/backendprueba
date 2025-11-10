// src/app/billing/tasks/subscription-billing.task.ts
import * as cron from 'node-cron';
import { BillingService } from '../service/billing.service';
import { BillingCycle, CreateInvoiceDto } from '../interfaces/billing.interface';
import { SubscriptionData } from '../../subscripcion/models/suscription.model';
export class Logger {
    constructor(private context: string) {}

    info(message: string, ...args: any[]): void {
        console.log(`[${this.context}] INFO:`, message, ...args);
    }

    error(message: string, ...args: any[]): void {
        console.error(`[${this.context}] ERROR:`, message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[${this.context}] WARN:`, message, ...args);
    }

    debug(message: string, ...args: any[]): void {
        console.debug(`[${this.context}] DEBUG:`, message, ...args);
    }
}

export class SubscriptionBillingTask {
  private readonly logger: Logger;
  private readonly cronJob: cron.ScheduledTask;

  constructor(
    private readonly billingService: BillingService,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('SubscriptionBillingTask');
    
    // Ejecutar cada día a las 00:01
    this.cronJob = cron.schedule('1 0 * * *', async () => {
      try {
        await this.processSubscriptions();
      } catch (error) {
        this.logger.error('Error en el procesamiento de suscripciones programado:', 
          error instanceof Error ? error.message : 'Error desconocido'
        );
      }
    });
  }

  public stopTask(): void {
    this.cronJob.stop();
    this.logger.info('Tarea de facturación detenida');
  }

  private async processSubscriptions(): Promise<void> {
    try {
      const subscriptions = await this.billingService.getActiveSubscriptions() || [];
      this.logger.info(`Procesando ${subscriptions.length} suscripciones activas`);

      for (const subscription of subscriptions) {
        await this.processSubscription(subscription);
      }

      this.logger.info('Procesamiento de suscripciones completado');
    } catch (error) {
      this.logger.error('Error al procesar las suscripciones:', 
        error instanceof Error ? error.message : 'Error desconocido'
      );
      throw error;
    }
  }

  private async processSubscription(subscription: SubscriptionData): Promise<void> {
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
    } catch (error) {
      this.logger.error(
        `Error al procesar la suscripción ${subscription.providerId}:`, 
        error instanceof Error ? error.message : 'Error desconocido'
      );
      throw error instanceof Error ? error : new Error('Error al procesar suscripción');
    }
  }

  private calculateBillingPeriod(subscription: SubscriptionData): { startDate: Date; endDate: Date } {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // Periodo de facturación de 30 días

    return { startDate, endDate };
  }

  private isValidSubscription(subscription: SubscriptionData): boolean {
    return Boolean(
      subscription &&
      subscription.providerId &&
      subscription.planType &&
      subscription.isActive
    );
  }

  private async shouldGenerateInvoice(subscription: SubscriptionData): Promise<boolean> {
    try {
      const billingCycle = await this.billingService.getBillingCycle(subscription.id);
      
      if (!billingCycle) {
        return true; // Primera factura
      }

      return new Date() >= new Date(billingCycle.nextBillingDate);
    } catch (error) {
      this.logger.error(`Error al verificar ciclo de facturación:`, 
        error instanceof Error ? error.message : 'Error desconocido'
      );
      return false;
    }
  }

  private createInvoiceData(subscription: SubscriptionData): CreateInvoiceDto {
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

