import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import PaymentService from '../services/payment.service';
import { Logger } from '../../../utils/logger';
import { 
  extractRoleInfo,
  requireSensitiveOperation,
  requirePermissions
} from '../../../middleware/role-validation.middleware';
import { Permission } from '../../../interfaces/roles.interface';

const router = Router();
const logger = new Logger('PaymentRoutes');
const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

// Rutas de pago con validación de roles granular
router.post('/authorize', 
  extractRoleInfo,
  requireSensitiveOperation('FINANCIAL_CRITICAL'),
  requirePermissions(Permission.AUTHORIZE_PAYMENT),
  (req, res) => paymentController.authorizePayment(req, res)
);

router.post('/capture', 
  extractRoleInfo,
  requireSensitiveOperation('FINANCIAL_CRITICAL'),
  requirePermissions(Permission.CAPTURE_PAYMENT),
  (req, res) => paymentController.capturePayment(req, res)
);

router.post('/refund', 
  extractRoleInfo,
  requireSensitiveOperation('FINANCIAL_CRITICAL'),
  requirePermissions(Permission.REFUND_PAYMENT),
  (req, res) => paymentController.refundPayment(req, res)
);

// Rutas de consulta (requieren autenticación pero menos restrictivas)
router.get('/methods', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_PRODUCT), // Los usuarios pueden ver métodos de pago
  (req, res) => paymentController.getPaymentMethods(req, res)
);

router.get('/status/:paymentId', 
  extractRoleInfo,
  requirePermissions(Permission.PROCESS_PAYMENT),
  (req, res) => paymentController.getPaymentStatus(req, res)
);

export default router;