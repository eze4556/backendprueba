// src/app/billing/services/pdf.service.ts
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import { createWriteStream, mkdirSync, existsSync } from 'fs';

interface InvoiceData {
  numero: number;
  providerId: string;
  providerName: string;  
  providerEmail?: string;
  plan: string;
  subscriptionMonth: string;
  total: number;
  estado?: string;
  fechaEmision?: Date;
  puntoVenta?: number;
  tipoComprobante?: number;
}

export class PdfService {
  async generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      try {
        // Crear documento optimizado para una página
        const pdfDoc = new PDFDocument({
          size: 'A4',
          margin: 30, // Reducimos el margen para tener más espacio
          bufferPages: true,
          compress: true // Habilitamos compresión
        });

        // Configurar eventos
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => {
          const result = Buffer.concat(chunks as unknown as Uint8Array[]);
          resolve(result);
        });
        pdfDoc.on('error', reject);

        // Crear directorio si no existe
        const uploadDir = 'uploads/invoices';
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }

        // Configurar archivo de salida
        const filename = `factura-${String(invoice.puntoVenta || 1).padStart(4, '0')}-${String(invoice.numero).padStart(8, '0')}.pdf`;
        const filePath = `${uploadDir}/${filename}`;
        const fileStream = createWriteStream(filePath);
        pdfDoc.pipe(fileStream);

        // Constantes de diseño
        const pageWidth = pdfDoc.page.width;
        const pageHeight = pdfDoc.page.height;
        const margin = 30;
        const contentWidth = pageWidth - (margin * 2);
        let y = 20; // Empezamos más arriba

        // ===== ENCABEZADO =====
        // Título
        pdfDoc.fillColor('#2C3E50')
              .fontSize(20) // Reducimos tamaño de fuente
              .font('Helvetica-Bold')
              .text('FACTURA', margin, y, { align: 'center', width: contentWidth });

        // Línea separadora
        y += 25; // Reducimos espacio
        pdfDoc.strokeColor('#3498DB')
              .lineWidth(1)
              .moveTo(margin, y)
              .lineTo(pageWidth - margin, y)
              .stroke();

        // Info empresa y número de factura
        y += 15;
        const infoY = y;
        pdfDoc.fillColor('#7F8C8D')
              .fontSize(9)
              .font('Helvetica')
              .text('Sistema de Facturación', margin, infoY)
              .text('CUIT: 00-00000000-0', margin, infoY + 12)
              .text('Buenos Aires, Argentina', margin, infoY + 24);

        // Número de factura y fecha
        const numeroFactura = `${String(invoice.puntoVenta || 1).padStart(4, '0')}-${String(invoice.numero).padStart(8, '0')}`;
        const fechaFactura = invoice.fechaEmision ? new Date(invoice.fechaEmision) : new Date();
        
        pdfDoc.text(`Factura #: ${numeroFactura}`, margin + contentWidth/2, infoY, { align: 'right' })
           .text(`Fecha: ${fechaFactura.toLocaleDateString('es-AR')}`, margin + contentWidth/2, infoY + 12, { align: 'right' });

        // ===== DATOS DEL CLIENTE =====
        y += 35; // Reducimos espacio
        
        // Recuadro de datos del cliente
        pdfDoc.rect(margin, y, contentWidth, 60) // Reducimos altura
           .fillAndStroke('#F8F9FA', '#E9ECEF');

        // Título de la sección
        y += 8; // Reducimos espacio
        pdfDoc.fillColor('#2C3E50')
           .fontSize(9) // Reducimos tamaño de fuente
           .font('Helvetica-Bold')
           .text('DATOS DEL CLIENTE', margin + 10, y);

        // Información del cliente en dos columnas
        y += 15;
        const col1 = margin + 10;
        const col2 = margin + contentWidth/2;

        pdfDoc.fontSize(9)
           .font('Helvetica')
           .text('Empresa:', col1, y)
           .font('Helvetica-Bold')
           .text(invoice.providerName, col1 + 60, y)
           .font('Helvetica')
           .text('Email:', col2, y)
           .text(invoice.providerEmail || 'No especificado', col2 + 40, y);

        y += 15;
        pdfDoc.text('Plan:', col1, y)
           .font('Helvetica-Bold')
           .text(invoice.plan.toUpperCase(), col1 + 60, y)
           .font('Helvetica')
           .text('Período:', col2, y)
           .text(invoice.subscriptionMonth, col2 + 40, y);

        // ===== DETALLE DE FACTURA =====
        y += 35;
        
        // Tabla de detalle
        const headers = ['Descripción', 'Período', 'Importe'];
        const columnWidths = [contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25];
        
        // Encabezado de tabla
        pdfDoc.fillColor('#2C3E50')
           .font('Helvetica-Bold')
           .fontSize(9);
        
        let xOffset = margin;
        headers.forEach((header, i) => {
          pdfDoc.text(header, xOffset, y, {
            width: columnWidths[i],
            align: i === 2 ? 'right' : 'left'
          });
          xOffset += columnWidths[i];
        });

        // Línea separadora
        y += 15;
        pdfDoc.lineWidth(0.5)
           .moveTo(margin, y)
           .lineTo(pageWidth - margin, y)
           .stroke();

        // Detalle
        y += 10;
        pdfDoc.font('Helvetica')
           .text(`Suscripción ${invoice.plan.toUpperCase()}`, margin, y, {
             width: columnWidths[0]
           })
           .text(invoice.subscriptionMonth, margin + columnWidths[0], y, {
             width: columnWidths[1]
           })
           .text(invoice.total.toLocaleString('es-AR', {
             style: 'currency',
             currency: 'ARS'
           }), margin + columnWidths[0] + columnWidths[1], y, {
             width: columnWidths[2],
             align: 'right'
           });

        // ===== TOTALES =====
        y = pageHeight - 120; // Reducimos el espacio del final
        
        // Línea separadora
        pdfDoc.lineWidth(0.5)
           .moveTo(margin + contentWidth/2, y)
           .lineTo(pageWidth - margin, y)
           .stroke();

        y += 10;
        pdfDoc.font('Helvetica-Bold')
           .text('TOTAL:', margin + contentWidth/2, y, {
             width: columnWidths[0] + columnWidths[1],
             align: 'right'
           })
           .text(invoice.total.toLocaleString('es-AR', {
             style: 'currency',
             currency: 'ARS'
           }), margin + columnWidths[0] + columnWidths[1], y, {
             width: columnWidths[2],
             align: 'right'
           });

        // ===== ESTADO =====
        y += 30;
        const estado = invoice.estado || 'pendiente';
        const estadoColor = estado.toLowerCase() === 'pagada' ? '#27AE60' : '#E67E22';
        
        pdfDoc.fillColor('#2C3E50')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Estado:', margin, y)
           .fillColor(estadoColor)
           .text(estado.toUpperCase(), margin + 60, y);

        // ===== PIE DE PÁGINA =====
        y = pageHeight - 45; // Reducimos espacio al final
        pdfDoc.fontSize(7) // Reducimos tamaño de fuente
           .font('Helvetica')
           .fillColor('#7F8C8D')
           .text('Este documento es una representación impresa de un Comprobante Electrónico', margin, y, {
             align: 'center',
             width: contentWidth
           })
           .text('soporte@facturacion.com', margin, y + 15, { // Reducimos espacio entre líneas
             align: 'center',
             width: contentWidth
           });

        // Finalizar documento
        pdfDoc.end();

        console.log('✓ PDF generado en:', filePath);

      } catch (error) {
        console.error('Error generando PDF:', error);
        reject(error);
      }
    });
  }
}