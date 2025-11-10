import { Request, Response } from 'express';
import PaymentService from '../services/payment.service';
import { PaymentError } from '../errors/payment.error';
import { Logger } from '../../../utils/logger';
import { PaymentData, PaymentProvider } from '../interfaces/payment.interface';
import HttpHandler from '../../../helpers/handler.helper';

export class PaymentController {
    private readonly logger: Logger;
    private readonly supportedMethods = Object.values(PaymentProvider);

    constructor(private readonly paymentService: PaymentService) {
        this.logger = new Logger('PaymentController');
    }

    async authorizePayment(req: Request, res: Response): Promise<void> {
        try {
            // Soportar tanto formato antiguo (metodo, monto) como nuevo (paymentMethod, amount)
            const metodo = req.body.metodo || req.body.paymentMethod;
            const monto = req.body.monto || req.body.amount;
            const datosTarjeta = req.body.datosTarjeta || req.body.cardData || {};

            if (!metodo || !monto) {
                HttpHandler.error(res, {
                    code: 400,
                    message: 'Payment method and amount are required'
                });
                return;
            }

            if (!this.supportedMethods.includes(metodo)) {
                HttpHandler.error(res, {
                    code: 400,
                    message: `Unsupported payment method: ${metodo}`
                });
                return;
            }

            if (typeof monto !== 'number' || monto <= 0) {
                HttpHandler.error(res, {
                    code: 400,
                    message: 'Amount must be a positive number'
                });
                return;
            }

            const paymentData = this.validateAndTransformPaymentData(datosTarjeta);
            const result = await this.paymentService.authorizePayment(metodo, paymentData, monto);

            HttpHandler.success(res, {
                message: 'Authorization successful',
                data: result
            });
        } catch (error) {
            this.handlePaymentError(error, res);
        }
    }

    async capturePayment(req: Request, res: Response): Promise<void> {
        try {
            // Soportar tanto formato antiguo como nuevo
            const metodo = req.body.metodo || req.body.paymentMethod;
            const paymentId = req.body.paymentId || req.body.authorizationId;
            const monto = req.body.monto || req.body.amount;

            if (!metodo || !paymentId || !monto) {
                HttpHandler.error(res, {
                    code: 400,
                    message: 'Payment method, payment ID and amount are required'
                });
                return;
            }

            const result = await this.paymentService.capturePayment(metodo, paymentId, monto);
            HttpHandler.success(res, {
                message: 'Capture successful',
                data: result
            });
        } catch (error) {
            this.handlePaymentError(error, res);
        }
    }

    async refundPayment(req: Request, res: Response): Promise<void> {
        try {
            const { metodo, paymentId, monto } = req.body;

            if (!metodo || !paymentId || !monto) {
                HttpHandler.error(res, {
                    code: 400,
                    message: 'Datos de reembolso incompletos'
                });
                return;
            }

            const result = await this.paymentService.refundPayment(metodo, paymentId, monto);
            HttpHandler.success(res, {
                message: 'Reembolso exitoso',
                data: result
            });
        } catch (error) {
            this.handlePaymentError(error, res);
        }
    }

    async getPaymentMethods(_req: Request, res: Response): Promise<void> {
        try {
            const methods = this.supportedMethods.map(method => ({
                id: method,
                name: this.getPaymentMethodName(method)
            }));

            HttpHandler.success(res, {
                message: 'Métodos de pago obtenidos exitosamente',
                data: methods
            });
        } catch (error) {
            this.handlePaymentError(error, res);
        }
    }

    async getPaymentStatus(req: Request, res: Response): Promise<void> {
        try {
            const { paymentId } = req.params;

            if (!paymentId) {
                HttpHandler.error(res, {
                    code: 400,
                    message: 'ID de pago es requerido'
                });
                return;
            }

            // TODO: Implementar consulta de estado real
            HttpHandler.success(res, {
                message: 'Estado del pago obtenido exitosamente',
                data: {
                    paymentId,
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            });
        } catch (error) {
            this.handlePaymentError(error, res);
        }
    }

    private validateAndTransformPaymentData(data: any): PaymentData {
        const paymentData: PaymentData = {
            amount: data.amount,
            currency: data.currency || 'USD'
        };

        // Copiar propiedades seguras
        if (data.description) paymentData.description = data.description;
        if (data.metadata) paymentData.metadata = data.metadata;

        // Validar y copiar datos sensibles según el método de pago
        if (data.token) paymentData.token = data.token;
        if (data.paypalOrderId) paymentData.paypalOrderId = data.paypalOrderId;
        if (data.walletAddress) paymentData.walletAddress = data.walletAddress;

        // Para pagos con tarjeta, validar formato
        if (data.cardNumber) {
            if (!this.validateCardData(data)) {
                throw new PaymentError('INVALID_CARD_DATA', 'Datos de tarjeta inválidos');
            }
            paymentData.cardNumber = data.cardNumber;
            paymentData.cvv = data.cvv;
            paymentData.expiryDate = data.expiryDate;
            paymentData.cardholderName = data.cardholderName;
        }

        return paymentData;
    }

    private validateCardData(data: any): boolean {
        // Implementar validaciones de tarjeta
        return !!(
            data.cardNumber?.match(/^\d{16}$/) &&
            data.cvv?.match(/^\d{3,4}$/) &&
            data.expiryDate?.match(/^\d{2}\/\d{2}$/) &&
            data.cardholderName?.length >= 3
        );
    }

    private getPaymentMethodName(method: string): string {
        const methodNames: Record<string, string> = {
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

    private handlePaymentError(error: unknown, res: Response): void {
        this.logger.error('Error en operación de pago:', { error });

        if (error instanceof PaymentError) {
            HttpHandler.error(res, {
                code: 400,
                message: error.message
            });
            return;
        }

        HttpHandler.error(res, {
            code: 500,
            message: 'Error interno del servidor'
        });
    }
}