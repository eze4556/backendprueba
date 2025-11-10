import { Injectable } from '@nestjs/common';
import { Invoice } from '../models/invoice.model';
import { createObjectCsvWriter } from 'csv-writer';
import { join } from 'path';

@Injectable()
export class ReportService {
  async generateMonthlyReport(month: number, year: number) {
    if (!month || !year || month < 1 || month > 12 || year < 2000) {
      throw new Error('Mes y año inválidos');
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const invoices = await Invoice.find({
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

  private generateSummary(invoices: any[]) {
    return {
      cantidadComprobantes: invoices.length,
      totalFacturado: invoices.reduce((acc, inv) => acc + inv.total, 0),
      totalIVA: invoices.reduce((acc, inv) => acc + inv.iva, 0),
      cantidadPorTipo: this.countByType(invoices)
    };
  }

  private generateVATDetail(invoices: any[]) {
    const vatRates = [21, 10.5, 27, 0]; // Alícuotas comunes
    const detail: any = {};

    vatRates.forEach(rate => {
      const invoicesWithRate = invoices.filter(inv => 
        inv.items.some((item: any) => item.alicuotaIva === rate)
      );

      if (invoicesWithRate.length > 0) {
        detail[rate] = {
          cantidad: invoicesWithRate.length,
          baseImponible: invoicesWithRate.reduce((acc, inv) => {
            const itemsWithRate = inv.items.filter((item: any) => item.alicuotaIva === rate);
            return acc + itemsWithRate.reduce((sum: number, item: any) => sum + item.subtotal, 0);
          }, 0),
          importeIVA: invoicesWithRate.reduce((acc, inv) => {
            const itemsWithRate = inv.items.filter((item: any) => item.alicuotaIva === rate);
            return acc + itemsWithRate.reduce((sum: number, item: any) => 
              sum + (item.subtotal * item.alicuotaIva / 100), 0);
          }, 0)
        };
      }
    });

    return detail;
  }

  private countByType(invoices: any[]) {
    return invoices.reduce((acc: any, inv) => {
      const type = inv.tipoComprobante;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }

  private async generateCSV(invoices: any[], month: number, year: number) {
    const filename = `libro_iva_ventas_${month}_${year}.csv`;
    const path = join(__dirname, '../../../temp', filename);

    const csvWriter = createObjectCsvWriter({
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
}