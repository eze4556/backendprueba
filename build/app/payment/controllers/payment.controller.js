"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_error_1 = require("../errors/payment.error");
const logger_1 = require("../../../utils/logger");
const payment_interface_1 = require("../interfaces/payment.interface");
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
        this.supportedMethods = Object.values(payment_interface_1.PaymentProvider);
        this.logger = new logger_1.Logger('PaymentController');
    }
    async authorizePayment(req, res) {
        try {
            // Soportar tanto formato antiguo (metodo, monto) como nuevo (paymentMethod, amount)
            const metodo = req.body.metodo || req.body.paymentMethod;
            const monto = req.body.monto || req.body.amount;
            const datosTarjeta = req.body.datosTarjeta || req.body.cardData || {};
            if (!metodo || !monto) {
                handler_helper_1.default.error(res, {
                    code: 400,
                    message: 'Payment method and amount are required'
                });
                return;
            }
            if (!this.supportedMethods.includes(metodo)) {
                handler_helper_1.default.error(res, {
                    code: 400,
                    message: `Unsupported payment method: ${metodo}`
                });
                return;
            }
            if (typeof monto !== 'number' || monto <= 0) {
                handler_helper_1.default.error(res, {
                    code: 400,
                    message: 'Amount must be a positive number'
                });
                return;
            }
            const paymentData = this.validateAndTransformPaymentData(datosTarjeta);
            const result = await this.paymentService.authorizePayment(metodo, paymentData, monto);
            handler_helper_1.default.success(res, {
                message: 'Authorization successful',
                data: result
            });
        }
        catch (error) {
            this.handlePaymentError(error, res);
        }
    }
    async capturePayment(req, res) {
        try {
            // Soportar tanto formato antiguo como nuevo
            const metodo = req.body.metodo || req.body.paymentMethod;
            const paymentId = req.body.paymentId || req.body.authorizationId;
            const monto = req.body.monto || req.body.amount;
            if (!metodo || !paymentId || !monto) {
                handler_helper_1.default.error(res, {
                    code: 400,
                    message: 'Payment method, payment ID and amount are required'
                });
                return;
            }
            const result = await this.paymentService.capturePayment(metodo, paymentId, monto);
            handler_helper_1.default.success(res, {
                message: 'Capture successful',
                data: result
            });
        }
        catch (error) {
            this.handlePaymentError(error, res);
        }
    }
    async refundPayment(req, res) {
        try {
            const { metodo, paymentId, monto } = req.body;
            if (!metodo || !paymentId || !monto) {
                handler_helper_1.default.error(res, {
                    code: 400,
                    message: 'Datos de reembolso incompletos'
                });
                return;
            }
            const result = await this.paymentService.refundPayment(metodo, paymentId, monto);
            handler_helper_1.default.success(res, {
                message: 'Reembolso exitoso',
                data: result
            });
        }
        catch (error) {
            this.handlePaymentError(error, res);
        }
    }
    async getPaymentMethods(_req, res) {
        try {
            const methods = this.supportedMethods.map(method => ({
                id: method,
                name: this.getPaymentMethodName(method)
            }));
            handler_helper_1.default.success(res, {
                message: 'Métodos de pago obtenidos exitosamente',
                data: methods
            });
        }
        catch (error) {
            this.handlePaymentError(error, res);
        }
    }
    async getPaymentStatus(req, res) {
        try {
            const { paymentId } = req.params;
            if (!paymentId) {
                handler_helper_1.default.error(res, {
                    code: 400,
                    message: 'ID de pago es requerido'
                });
                return;
            }
            // TODO: Implementar consulta de estado real
            handler_helper_1.default.success(res, {
                message: 'Estado del pago obtenido exitosamente',
                data: {
                    paymentId,
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            });
        }
        catch (error) {
            this.handlePaymentError(error, res);
        }
    }
    validateAndTransformPaymentData(data) {
        const paymentData = {
            amount: data.amount,
            currency: data.currency || 'USD'
        };
        // Copiar propiedades seguras
        if (data.description)
            paymentData.description = data.description;
        if (data.metadata)
            paymentData.metadata = data.metadata;
        // Validar y copiar datos sensibles según el método de pago
        if (data.token)
            paymentData.token = data.token;
        if (data.paypalOrderId)
            paymentData.paypalOrderId = data.paypalOrderId;
        if (data.walletAddress)
            paymentData.walletAddress = data.walletAddress;
        // Para pagos con tarjeta, validar formato
        if (data.cardNumber) {
            if (!this.validateCardData(data)) {
                throw new payment_error_1.PaymentError('INVALID_CARD_DATA', 'Datos de tarjeta inválidos');
            }
            paymentData.cardNumber = data.cardNumber;
            paymentData.cvv = data.cvv;
            paymentData.expiryDate = data.expiryDate;
            paymentData.cardholderName = data.cardholderName;
        }
        return paymentData;
    }
    validateCardData(data) {
        var _a, _b, _c, _d;
        // Implementar validaciones de tarjeta
        return !!(((_a = data.cardNumber) === null || _a === void 0 ? void 0 : _a.match(/^\d{16}$/)) &&
            ((_b = data.cvv) === null || _b === void 0 ? void 0 : _b.match(/^\d{3,4}$/)) &&
            ((_c = data.expiryDate) === null || _c === void 0 ? void 0 : _c.match(/^\d{2}\/\d{2}$/)) &&
            ((_d = data.cardholderName) === null || _d === void 0 ? void 0 : _d.length) >= 3);
    }
    getPaymentMethodName(method) {
        const methodNames = {
            paypal: 'PayPal',
            stripe: 'Stripe',
            personalPay: 'Personal Pay',
            binance: 'Binance',
            prex: 'Prex',
            payoneer: 'Payoneer',
            ripio: 'Ripio',
            tarjeta: 'Tarjeta de Crédito/Débito'
        };
        return methodNames[method] || method;
    }
    handlePaymentError(error, res) {
        this.logger.error('Error en operación de pago:', { error });
        if (error instanceof payment_error_1.PaymentError) {
            handler_helper_1.default.error(res, {
                code: 400,
                message: error.message
            });
            return;
        }
        handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error interno del servidor'
        });
    }
}
exports.PaymentController = PaymentController;
//# sourceMappingURL=payment.controller.js.map