"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const invoice_model_1 = require("../models/invoice.model");
const csv_writer_1 = require("csv-writer");
const path_1 = require("path");
let ReportService = class ReportService {
    async generateMonthlyReport(month, year) {
        if (!month || !year || month < 1 || month > 12 || year < 2000) {
            throw new Error('Mes y año inválidos');
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const invoices = await invoice_model_1.Invoice.find({
            fechaEmision: {
                $gte: startDate,
                $lte: endDate
            },
            estado: 'aprobada'
        }).populate('userId');
        if (!Array.isArray(invoices)) {
            throw new Error('No se pudo obtener las facturas');
        }
        const report = {
            resumen: this.generateSummary(invoices),
            detalleIVA: this.generateVATDetail(invoices),
            csv: await this.generateCSV(invoices, month, year)
        };
        return report;
    }
    generateSummary(invoices) {
        return {
            cantidadComprobantes: invoices.length,
            totalFacturado: invoices.reduce((acc, inv) => acc + inv.total, 0),
            totalIVA: invoices.reduce((acc, inv) => acc + inv.iva, 0),
            cantidadPorTipo: this.countByType(invoices)
        };
    }
    generateVATDetail(invoices) {
        const vatRates = [21, 10.5, 27, 0]; // Alícuotas comunes
        const detail = {};
        vatRates.forEach(rate => {
            const invoicesWithRate = invoices.filter(inv => inv.items.some((item) => item.alicuotaIva === rate));
            if (invoicesWithRate.length > 0) {
                detail[rate] = {
                    cantidad: invoicesWithRate.length,
                    baseImponible: invoicesWithRate.reduce((acc, inv) => {
                        const itemsWithRate = inv.items.filter((item) => item.alicuotaIva === rate);
                        return acc + itemsWithRate.reduce((sum, item) => sum + item.subtotal, 0);
                    }, 0),
                    importeIVA: invoicesWithRate.reduce((acc, inv) => {
                        const itemsWithRate = inv.items.filter((item) => item.alicuotaIva === rate);
                        return acc + itemsWithRate.reduce((sum, item) => sum + (item.subtotal * item.alicuotaIva / 100), 0);
                    }, 0)
                };
            }
        });
        return detail;
    }
    countByType(invoices) {
        return invoices.reduce((acc, inv) => {
            const type = inv.tipoComprobante;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
    }
    async generateCSV(invoices, month, year) {
        const filename = `libro_iva_ventas_${month}_${year}.csv`;
        const path = (0, path_1.join)(__dirname, '../../../temp', filename);
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path,
            header: [
                { id: 'fecha', title: 'Fecha' },
                { id: 'tipo', title: 'Tipo Comprobante' },
                { id: 'punto_venta', title: 'Punto de Venta' },
                { id: 'numero', title: 'Número' },
                { id: 'cliente_tipo_doc', title: 'Tipo Doc. Cliente' },
                { id: 'cliente_nro_doc', title: 'Nro. Doc. Cliente' },
                { id: 'cliente_nombre', title: 'Denominación Cliente' },
                { id: 'neto', title: 'Importe Neto Gravado' },
                { id: 'iva', title: 'IVA' },
                { id: 'total', title: 'Importe Total' },
                { id: 'cae', title: 'CAE' }
            ]
        });
        const records = invoices.map(inv => ({
            fecha: inv.fechaEmision.toLocaleDateString(),
            tipo: inv.tipoComprobante,
            punto_venta: inv.puntoVenta.toString().padStart(4, '0'),
            numero: inv.numero.toString().padStart(8, '0'),
            cliente_tipo_doc: '80', // CUIT
            cliente_nro_doc: inv.userId.cuit,
            cliente_nombre: inv.userId.razonSocial,
            neto: inv.subtotal.toFixed(2),
            iva: inv.iva.toFixed(2),
            total: inv.total.toFixed(2),
            cae: inv.cae
        }));
        await csvWriter.writeRecords(records);
        return path;
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)()
], ReportService);
//# sourceMappingURL=report.service.js.map