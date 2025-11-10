"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentError = void 0;
class PaymentError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'PaymentError';
    }
}
exports.PaymentError = PaymentError;
//# sourceMappingURL=payment.error.js.map