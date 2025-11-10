"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceStatus = exports.BillingStatus = void 0;
var BillingStatus;
(function (BillingStatus) {
    BillingStatus["ACTIVE"] = "active";
    BillingStatus["PENDING"] = "pending";
    BillingStatus["FAILED"] = "failed";
    BillingStatus["CANCELLED"] = "cancelled";
})(BillingStatus || (exports.BillingStatus = BillingStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["PENDING"] = "pending";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
    InvoiceStatus["FAILED"] = "failed";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
//# sourceMappingURL=billing.interface.js.map