"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billing_controller_1 = require("../controllers/billing.controller");
const billing_service_1 = require("../services/billing.service");
const role_validation_middleware_1 = require("../../../middleware/role-validation.middleware");
const roles_interface_1 = require("../../../interfaces/roles.interface");
const router = (0, express_1.Router)();
// Importar todos los servicios necesarios
const afip_service_1 = require("../services/afip.service");
const product_type_service_1 = require("../../productTypes/services/product-type.service");
const subscription_service_1 = require("../../subscripcion/services/subscription.service");
const pdf_service_1 = require("../services/pdf.service");
const storage_service_1 = require("../services/storage.service");
const report_service_1 = require("../services/report.service");
// Configuración de AFIP
const afipConfig = {
    isProduction: false, // Modo testing
    cuit: process.env.AFIP_CUIT || '20111111112',
    certificatePath: process.env.AFIP_CERT_PATH || './certificates/testing.crt',
    privateKeyPath: process.env.AFIP_KEY_PATH || './certificates/testing.key'
};
// Inicializar servicios
const pdfService = new pdf_service_1.PdfService(); // Este servicio no requiere parámetros
const storageService = new storage_service_1.StorageService();
const reportService = new report_service_1.ReportService();
const productTypeService = new product_type_service_1.ProductTypeService();
const subscriptionService = new subscription_service_1.SubscriptionService();
const afipService = new afip_service_1.AfipService(afipConfig);
// Inicializar servicio de facturación con todas las dependencias
const billingService = new billing_service_1.BillingService(afipService, productTypeService, subscriptionService, pdfService, storageService, reportService);
const billingController = new billing_controller_1.BillingController(billingService);
// Health check endpoint (no requiere autenticación)
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'billing',
        timestamp: new Date().toISOString()
    });
});
// Rutas de facturación protegidas con validación de roles
router.post('/invoices', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requireSensitiveOperation)('FINANCIAL_CRITICAL'), (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.CREATE_INVOICE), (req, res) => billingController.createInvoice(req, res));
// Otras rutas protegidas con autenticación y permisos específicos
router.get('/invoices/:id', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_INVOICE), (req, res) => billingController.getInvoice(req, res));
// Rutas PDF (requieren permisos de visualización de facturas)
router.get('/invoices/:id/pdf', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_INVOICE), (req, res) => billingController.downloadInvoicePdf(req, res));
router.get('/invoices/:id/download', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_INVOICE), (req, res) => billingController.downloadInvoicePdfAsAttachment(req, res));
exports.default = router;
//# sourceMappingURL=billing.routes.js.map