"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const payment_service_1 = __importDefault(require("../services/payment.service"));
const logger_1 = require("../../../utils/logger");
const role_validation_middleware_1 = require("../../../middleware/role-validation.middleware");
const roles_interface_1 = require("../../../interfaces/roles.interface");
const router = (0, express_1.Router)();
const logger = new logger_1.Logger('PaymentRoutes');
const paymentService = new payment_service_1.default();
const paymentController = new payment_controller_1.PaymentController(paymentService);
// Rutas de pago con validación de roles granular
router.post('/authorize', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requireSensitiveOperation)('FINANCIAL_CRITICAL'), (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.AUTHORIZE_PAYMENT), (req, res) => paymentController.authorizePayment(req, res));
router.post('/capture', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requireSensitiveOperation)('FINANCIAL_CRITICAL'), (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.CAPTURE_PAYMENT), (req, res) => paymentController.capturePayment(req, res));
router.post('/refund', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requireSensitiveOperation)('FINANCIAL_CRITICAL'), (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.REFUND_PAYMENT), (req, res) => paymentController.refundPayment(req, res));
// Rutas de consulta (requieren autenticación pero menos restrictivas)
router.get('/methods', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_PRODUCT), // Los usuarios pueden ver métodos de pago
(req, res) => paymentController.getPaymentMethods(req, res));
router.get('/status/:paymentId', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.PROCESS_PAYMENT), (req, res) => paymentController.getPaymentStatus(req, res));
exports.default = router;
//# sourceMappingURL=payment.routes.js.map