"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const invoice_model_1 = require("../models/invoice.model");
const provider_service_1 = require("../../proveedores/servicio/provider.service");
class BillingService {
    constructor(afipService, productTypeService, subscriptionService, pdfService, storageService, reportService) {
        this.afipService = afipService;
        this.productTypeService = productTypeService;
        this.subscriptionService = subscriptionService;
        this.pdfService = pdfService;
        this.storageService = storageService;
        this.reportService = reportService;
        this.providerService = new provider_service_1.ProviderService();
    }
    async getProviderById(providerId) {
        return await this.providerService.getProviderById(providerId);
    }
    async createInvoice(data) {
        var _a;
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
        const invoice = new invoice_model_1.Invoice({
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
            caeExpiration: (_a = invoice.caeVencimiento) === null || _a === void 0 ? void 0 : _a.toISOString(),
            total: invoice.total,
            status: invoice.estado,
            subscriptionMonth: invoice.subscriptionMonth,
            plan: invoice.plan
        };
    }
    async getInvoiceById(id) {
        try {
            const invoice = await invoice_model_1.Invoice.findById(id);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            return invoice;
        }
        catch (error) {
            throw new Error(`Error getting invoice: ${error.message}`);
        }
    }
    async generateInvoicePdf(invoiceId) {
        try {
            console.log('Obteniendo factura para PDF:', invoiceId);
            const invoice = await invoice_model_1.Invoice.findById(invoiceId).lean();
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
                providerEmail: provider.email || 'No especificado',
            };
            const buffer = await this.pdfService.generateInvoicePdf(invoiceData);
            if (!Buffer.isBuffer(buffer)) {
                throw new Error('Invalid PDF buffer received');
            }
            console.log('PDF generado correctamente, tamaño:', buffer.length);
            return buffer;
        }
        catch (error) {
            console.error('Error en generateInvoicePdf:', error);
            throw new Error(`Error generating PDF: ${error.message}`);
        }
    }
    async generateMonthlyReport(month, year) {
        try {
            return this.reportService.generateMonthlyReport(month, year);
        }
        catch (error) {
            throw new Error(`Error generating report: ${error.message}`);
        }
    }
    async getNextInvoiceNumber(puntoVenta, tipoComprobante) {
        const lastInvoice = await invoice_model_1.Invoice.findOne({
            puntoVenta,
            tipoComprobante
        }).sort({ numero: -1 });
        return lastInvoice ? lastInvoice.numero + 1 : 1;
    }
}
exports.BillingService = BillingService;
//# sourceMappingURL=billing.service.js.map