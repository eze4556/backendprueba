import { Router, Request, Response } from 'express';
import { BillingController } from '../controllers/billing.controller';
import { BillingService } from '../services/billing.service';
import { 
  extractRoleInfo,
  requireSensitiveOperation,
  requirePermissions,
  canAccessFinancial
} from '../../../middleware/role-validation.middleware';
import { Permission } from '../../../interfaces/roles.interface';

const router = Router();

// Importar todos los servicios necesarios
import { AfipService } from '../services/afip.service';
import { ProductTypeService } from '../../productTypes/services/product-type.service';
import { SubscriptionService } from '../../subscripcion/services/subscription.service';
import { PdfService } from '../services/pdf.service';
import { StorageService } from '../services/storage.service';
import { ReportService } from '../services/report.service';

// Configuración de AFIP
const afipConfig = {
    isProduction: false, // Modo testing
    cuit: process.env.AFIP_CUIT || '20111111112',
    certificatePath: process.env.AFIP_CERT_PATH || './certificates/testing.crt',
    privateKeyPath: process.env.AFIP_KEY_PATH || './certificates/testing.key'
};

// Inicializar servicios
const pdfService = new PdfService(); // Este servicio no requiere parámetros
const storageService = new StorageService();
const reportService = new ReportService();
const productTypeService = new ProductTypeService();
const subscriptionService = new SubscriptionService();
const afipService = new AfipService(afipConfig);

// Inicializar servicio de facturación con todas las dependencias
const billingService = new BillingService(
    afipService,
    productTypeService,
    subscriptionService,
    pdfService,
    storageService,
    reportService
);

const billingController = new BillingController(billingService);

// Health check endpoint (no requiere autenticación)
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'billing',
        timestamp: new Date().toISOString()
    });
});

// Rutas de facturación protegidas con validación de roles
router.post('/invoices', 
  extractRoleInfo,
  requireSensitiveOperation('FINANCIAL_CRITICAL'),
  requirePermissions(Permission.CREATE_INVOICE),
  (req: Request, res: Response) => billingController.createInvoice(req, res)
);

// Otras rutas protegidas con autenticación y permisos específicos
router.get('/invoices/:id', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_INVOICE),
  (req: Request, res: Response) => billingController.getInvoice(req, res)
);

// Rutas PDF (requieren permisos de visualización de facturas)
router.get('/invoices/:id/pdf', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_INVOICE),
  (req: Request, res: Response) => billingController.downloadInvoicePdf(req, res)
);

router.get('/invoices/:id/download', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_INVOICE),
  (req: Request, res: Response) => billingController.downloadInvoicePdfAsAttachment(req, res)
);

export default router;