// src/app/billing/controllers/billing.controller.ts
import { Request, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { BillingService } from '../services/billing.service';
import { EmailService } from '../services/email.service';
import mongoose from 'mongoose';
import { Invoice, IInvoice } from '../models/invoice.model';

export class BillingController {
  private pdfService: PdfService;
  private billingService: BillingService;
  private emailService: EmailService;

  constructor(billingService: BillingService) {
    this.pdfService = new PdfService();
    this.billingService = billingService;
    this.emailService = new EmailService();
  }

  /**
   * Crear una nueva factura
   * POST /api/billing/invoices
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos requeridos
      const { providerId, subscriptionId, amount, dueDate } = req.body;
      
      if (!providerId) {
        res.status(400).json({ 
          success: false,
          error: 'providerId is required'
        });
        return;
      }

      if (!subscriptionId) {
        res.status(400).json({ 
          success: false,
          error: 'subscriptionId is required'
        });
        return;
      }

      if (!amount || amount <= 0) {
        res.status(400).json({ 
          success: false,
          error: 'amount is required and must be greater than 0'
        });
        return;
      }

      // Validar ObjectIds
      if (!mongoose.Types.ObjectId.isValid(providerId)) {
        res.status(400).json({ 
          success: false,
          error: 'Invalid providerId format'
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        res.status(400).json({ 
          success: false,
          error: 'Invalid subscriptionId format'
        });
        return;
      }

      const invoice = await this.billingService.createInvoice(req.body);
      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice
      });
    } catch (error) {
      console.error('Error al crear factura:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al crear la factura',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtener una factura por ID
   * GET /api/billing/invoices/:id
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ 
          success: false,
          error: 'Invalid invoice ID format'
        });
        return;
      }

      const invoice = await this.billingService.getInvoiceById(id);
      if (!invoice) {
        res.status(404).json({ 
          success: false,
          error: 'Factura no encontrada' 
        });
        return;
      }
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      console.error('Error al obtener factura:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error al obtener la factura',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Endpoint para descargar el PDF de una factura
   * GET /api/billing/invoices/:id/pdf
   */
  async downloadInvoicePdf(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.id;
      console.log('ID de factura solicitada:', invoiceId);

      // Obtener la factura de la base de datos
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice) {
        res.status(404).json({ 
          error: 'Factura no encontrada',
          invoiceId 
        });
        return;
      }

      console.log('Factura encontrada:', invoice);

      // Obtener datos del proveedor
      const provider = await this.billingService.getProviderById(invoice.providerId);
      
      if (!provider) {
        throw new Error('No se encontró el proveedor asociado a la factura');
      }

      // Preparar datos para el PDF
      const invoiceData = {
        numero: invoice.numero,
        providerId: invoice.providerId,
        providerName: provider.name,
        providerEmail: provider.contactEmail,
        plan: invoice.plan,
        subscriptionMonth: invoice.subscriptionMonth,
        total: invoice.total,
        estado: invoice.estado,
        fechaEmision: invoice.fechaEmision,
        puntoVenta: invoice.puntoVenta,
        tipoComprobante: invoice.tipoComprobante
      };

      // Generar el PDF
      console.log('Generando PDF...');
      const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceData);

      console.log(`✓ PDF generado: ${pdfBuffer.length} bytes`);
      
      // Verificar que el buffer no esté vacío
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('El PDF generado está vacío');
      }

      // Verificar que sea un PDF válido (debe empezar con %PDF-)
      const pdfHeader = pdfBuffer.slice(0, 5).toString();
      console.log('Header del PDF:', pdfHeader);
      
      if (!pdfHeader.startsWith('%PDF-')) {
        throw new Error('El buffer generado no es un PDF válido');
      }

      // Configurar headers
      const filename = `factura-${String(invoice.puntoVenta || 1).padStart(4, '0')}-${String(invoice.numero).padStart(8, '0')}.pdf`;

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      });

      console.log('Enviando PDF al cliente...');
      
      // Enviar el buffer
      res.end(pdfBuffer);

      console.log('✓ PDF enviado exitosamente');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      res.status(500).json({ 
        error: 'Error al generar el PDF',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Endpoint alternativo para descargar como archivo (download)
   * GET /api/billing/invoices/:id/download
   */
  async downloadInvoicePdfAsAttachment(req: Request, res: Response): Promise<void> {
    try {
      const invoiceId = req.params.id;
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice) {
        res.status(404).json({ error: 'Factura no encontrada' });
        return;
      }

      // Obtener datos del proveedor
      const provider = await this.billingService.getProviderById(invoice.providerId);
      
      if (!provider) {
        throw new Error('No se encontró el proveedor asociado a la factura');
      }

      const invoiceData = {
        numero: invoice.numero,
        providerId: invoice.providerId,
        providerName: provider.name,
        providerEmail: provider.contactEmail,
        plan: invoice.plan,
        subscriptionMonth: invoice.subscriptionMonth,
        total: invoice.total,
        estado: invoice.estado,
        fechaEmision: invoice.fechaEmision,
        puntoVenta: invoice.puntoVenta,
        tipoComprobante: invoice.tipoComprobante
      };

      const pdfBuffer = await this.pdfService.generateInvoicePdf(invoiceData);
      const filename = `factura-${String(invoice.puntoVenta || 1).padStart(4, '0')}-${String(invoice.numero).padStart(8, '0')}.pdf`;
      
      // Enviar correo con la factura
      try {
        if (provider.contactEmail) {
          await this.emailService.sendInvoiceEmail(
            provider.contactEmail,
            `${invoice.puntoVenta}-${invoice.numero}`,
            pdfBuffer
          );
          console.log('✓ Factura enviada por correo a:', provider.contactEmail);
        }
      } catch (emailError) {
        console.error('Error al enviar el correo:', emailError);
        // No detenemos el proceso si falla el envío del correo
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Error al descargar PDF:', error);
      res.status(500).json({ 
        error: 'Error al descargar el PDF',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}