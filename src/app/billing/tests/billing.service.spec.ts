import { BillingService } from '../services/billing.service';
import { AfipService } from '../services/afip.service';
import { ProductTypeService } from '../../productTypes/services/product-type.service';
import { SubscriptionService } from '../../subscripcion/services/subscription.service';
import { PdfService } from '../services/pdf.service';
import { StorageService } from '../services/storage.service';
import { ReportService } from '../services/report.service';
import { CreateInvoiceDto } from '../dtos/invoice.dto';

describe('BillingService', () => {
  let billingService: BillingService;

  beforeAll(() => {
    billingService = new BillingService(
      new AfipService({ cuit: '20123456789', certificatePath: '', privateKeyPath: '', isProduction: false }),
      new ProductTypeService(),
      new SubscriptionService(),
      new PdfService(),
      new StorageService(),
      new ReportService()
    );
  });

  it('debería crear una factura válida', async () => {
    const dto: CreateInvoiceDto & { invoiceType: number } = {
      providerId: 'provider123',
      subscriptionMonth: '2025-10',
      plan: 'plata',
      pointOfSale: 1,
      numero: 12345, // Ensure this property exists in CreateInvoiceDto or remove it
      puntoVenta: 1, // Ensure this property exists in CreateInvoiceDto or remove it
      tipoComprobante: 11, // Ensure this property exists in CreateInvoiceDto or remove it
      invoiceType: 11 // Additional property
    } as CreateInvoiceDto & { invoiceType: number };
    dto.invoiceType = 11;
    const result = await billingService.createInvoice(dto);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('invoiceNumber');
    expect(result.total).toBeGreaterThan(0);
    expect(['pendiente', 'aprobada', 'rechazada']).toContain(result.status);
    expect(result.subscriptionMonth).toBe('2025-10');
    expect(result.plan).toBe('plata');
  });
});
