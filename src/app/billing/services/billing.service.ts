// src/app/billing/services/billing.service.ts
import { ProductTypeService } from '../../productTypes/services/product-type.service';
import { SubscriptionService } from '../../subscripcion/services/subscription.service';
import { PdfService } from './pdf.service';
import { StorageService } from './storage.service';
import { ReportService } from './report.service';
import { AfipService } from './afip.service';
import { Invoice, IInvoice } from '../models/invoice.model';
import { CreateInvoiceDto, InvoiceResponseDto } from '../dtos/invoice.dto';
import { AfipInvoiceRequest } from '../interfaces/afip-response.interface';
import mongoose from 'mongoose';
import { ProviderService } from '../../proveedores/servicio/provider.service';

export class BillingService {
  private providerService = new ProviderService();

  constructor(
    private afipService: AfipService,
    private productTypeService: ProductTypeService,
    private subscriptionService: SubscriptionService,
    private pdfService: PdfService,
    private storageService: StorageService,
    private reportService: ReportService
  ) {}

  async getProviderById(providerId: string) {
    return await this.providerService.getProviderById(providerId);
  }



  async createInvoice(data: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    // Verificar que el proveedor existe
    const provider = await this.providerService.getProviderById(data.providerId);
    if (!provider) {
      throw new Error(`Proveedor no encontrado con ID: ${data.providerId}`);
    }

    // Calcular el total según el plan
    let total = 0;
    switch (data.plan) {
      case 'bronce':
        total = 1000;
        break;
      case 'plata':
        total = 2000;
        break;
      case 'gold':
        total = 3000;
        break;
      default:
        throw new Error('Plan inválido');
    }

    const invoice = new Invoice({
      numero: data.numero,
      puntoVenta: data.puntoVenta,
      tipoComprobante: data.tipoComprobante,
      providerId: data.providerId,
      subscriptionMonth: data.subscriptionMonth,
      plan: data.plan,
      total,
      estado: 'pendiente',
      fechaEmision: new Date()
    });
    await invoice.save();
    return {
      id: String(invoice._id),
      invoiceNumber: invoice.numero.toString(),
      cae: invoice.cae,
      caeExpiration: invoice.caeVencimiento?.toISOString(),
      total: invoice.total,
      status: invoice.estado,
      subscriptionMonth: invoice.subscriptionMonth,
      plan: invoice.plan
    };
  }

  async getInvoiceById(id: string): Promise<IInvoice> {
    try {
      const invoice = await Invoice.findById(id);
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      throw new Error(`Error getting invoice: ${(error as Error).message}`);
    }
  }

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    try {
      console.log('Obteniendo factura para PDF:', invoiceId);
      const invoice = await Invoice.findById(invoiceId).lean();
      
      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      console.log('Generando PDF para factura:', invoice);
      const provider = await this.providerService.getProviderById(invoice.providerId);
      if (!provider) {
        throw new Error('Proveedor no encontrado');
      }

      const invoiceData = {
        ...invoice,
        providerName: provider.name,
        providerEmail: (provider as any).email || 'No especificado',
      };

      const buffer = await this.pdfService.generateInvoicePdf(invoiceData);
      
      if (!Buffer.isBuffer(buffer)) {
        throw new Error('Invalid PDF buffer received');
      }
      
      console.log('PDF generado correctamente, tamaño:', buffer.length);
      return buffer;
    } catch (error) {
      console.error('Error en generateInvoicePdf:', error);
      throw new Error(`Error generating PDF: ${(error as Error).message}`);
    }
  }

  async generateMonthlyReport(month: number, year: number) {
    try {
      return this.reportService.generateMonthlyReport(month, year);
    } catch (error) {
      throw new Error(`Error generating report: ${(error as Error).message}`);
    }
  }

  private async getNextInvoiceNumber(puntoVenta: number, tipoComprobante: number): Promise<number> {
    const lastInvoice = await Invoice.findOne({
      puntoVenta,
      tipoComprobante
    }).sort({ numero: -1 });

    return lastInvoice ? lastInvoice.numero + 1 : 1;
  }
}