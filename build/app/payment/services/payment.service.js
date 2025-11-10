"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../../utils/logger");
const payment_error_1 = require("../errors/payment.error");
class PaymentService {
    constructor() {
        this.logger = logger_1.Logger.getInstance('PaymentService');
        this.supportedMethods = ['paypal', 'personalPay', 'binance', 'prex', 'payoneer', 'ripio', 'stripe', 'tarjeta'];
    }
    async authorizePayment(metodo, datosTarjeta, monto) {
        try {
            if (!metodo || !this.supportedMethods.includes(metodo)) {
                const error = new payment_error_1.PaymentError('INVALID_METHOD', `Método de pago no soportado: ${metodo}`);
                this.logger.error(error.message);
                throw error;
            }
            if (!monto || monto <= 0) {
                const error = new payment_error_1.PaymentError('INVALID_AMOUNT', 'El monto debe ser mayor a cero');
                this.logger.error(error.message);
                throw error;
            }
            this.logger.info(`Iniciando autorización de pago: ${metodo}`);
            await this.validatePaymentData(metodo, datosTarjeta);
            const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2)}`;
            const result = {
                success: true,
                metodo,
                monto,
                message: `Autorización ${metodo} exitosa`,
                paymentId
            };
            this.logger.info(`Autorización exitosa: ${paymentId}`);
            return result;
        }
        catch (error) {
            if (error instanceof payment_error_1.PaymentError) {
                throw error;
            }
            this.logger.error(`Error en autorización de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            throw new payment_error_1.PaymentError('AUTHORIZATION_ERROR', 'Error en la autorización del pago');
        }
    }
    async capturePayment(metodo, paymentId, monto) {
        try {
            if (!paymentId) {
                throw new payment_error_1.PaymentError('INVALID_PAYMENT_ID', 'ID de pago inválido');
            }
            this.logger.info(`Capturando pago: ${paymentId}`);
            // Validar que el pago existe y está pendiente de captura
            await this.validatePaymentExists(paymentId);
            const result = {
                success: true,
                metodo,
                monto,
                paymentId,
                message: 'Captura exitosa'
            };
            this.logger.info(`Captura exitosa: ${paymentId}`);
            return result;
        }
        catch (error) {
            if (error instanceof payment_error_1.PaymentError) {
                throw error;
            }
            this.logger.error(`Error en captura de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            throw new payment_error_1.PaymentError('CAPTURE_ERROR', 'Error en la captura del pago');
        }
    }
    async refundPayment(metodo, paymentId, monto) {
        try {
            if (!paymentId) {
                throw new payment_error_1.PaymentError('INVALID_PAYMENT_ID', 'ID de pago inválido');
            }
            if (!monto || monto <= 0) {
                throw new payment_error_1.PaymentError('INVALID_AMOUNT', 'El monto debe ser mayor a cero');
            }
            this.logger.info(`Procesando reembolso: ${paymentId}`);
            // Validar que el pago existe y puede ser reembolsado
            await this.validateRefundable(paymentId, monto);
            const result = {
                success: true,
                metodo,
                monto,
                paymentId,
                message: 'Reembolso exitoso'
            };
            this.logger.info(`Reembolso exitoso: ${paymentId}`);
            return result;
        }
        catch (error) {
            if (error instanceof payment_error_1.PaymentError) {
                throw error;
            }
            this.logger.error(`Error en reembolso: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            throw new payment_error_1.PaymentError('REFUND_ERROR', 'Error en el reembolso del pago');
        }
    }
    async validatePaymentData(metodo, data) {
        // Implementar validaciones específicas para cada método de pago
        switch (metodo) {
            case 'tarjeta':
                if (!data.cardNumber || !data.cvv || !data.expiryDate) {
                    throw new payment_error_1.PaymentError('INVALID_CARD_DATA', 'Datos de tarjeta incompletos');
                }
                break;
            case 'paypal':
            case 'stripe':
                if (!data.token) {
                    throw new payment_error_1.PaymentError('INVALID_TOKEN', 'Token de pago requerido');
                }
                break;
            // Agregar validaciones para otros métodos según sea necesario
        }
    }
    async validatePaymentExists(paymentId) {
        // Implementar validación de existencia del pago
        // Por ahora solo simulamos la validación
        if (!paymentId.startsWith('pay_')) {
            throw new payment_error_1.PaymentError('PAYMENT_NOT_FOUND', 'Pago no encontrado');
        }
    }
    async validateRefundable(paymentId, amount) {
        // Implementar validación de reembolso
        // Por ahora solo simulamos la validación
        await this.validatePaymentExists(paymentId);
        // Simular validación de monto reembolsable
        if (amount > 1000000) {
            throw new payment_error_1.PaymentError('REFUND_LIMIT_EXCEEDED', 'Monto de reembolso excede el límite permitido');
        }
    }
}
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map