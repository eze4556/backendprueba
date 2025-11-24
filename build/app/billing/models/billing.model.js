"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCycle = exports.BillingInvoice = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const billing_interface_1 = require("../interfaces/billing.interface");
const BillingInvoiceSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    providerId: { type: String, required: true, index: true },
    subscriptionId: { type: String, required: true, index: true },
    plan: {
        id: { type: String, required: true },
        type: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        features: [String]
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: Object.values(billing_interface_1.InvoiceStatus),
        index: true
    },
    billingPeriod: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    createdAt: { type: Date, required: true, default: Date.now },
    paidAt: { type: Date },
    dueDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    paymentId: { type: String },
    metadata: { type: Map, of: String }
}, {
    timestamps: true
});
// Índices compuestos para consultas frecuentes
BillingInvoiceSchema.index({ providerId: 1, status: 1 });
BillingInvoiceSchema.index({ subscriptionId: 1, createdAt: -1 });
BillingInvoiceSchema.index({ dueDate: 1, status: 1 });
const BillingCycleSchema = new mongoose_1.Schema({
    subscriptionId: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    lastBillingDate: { type: Date },
    nextBillingDate: { type: Date, required: true, index: true },
    status: {
        type: String,
        required: true,
        enum: Object.values(billing_interface_1.BillingStatus),
        index: true
    },
    frequency: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly'
    },
    lastInvoiceId: { type: String },
    metadata: { type: Map, of: String }
}, {
    timestamps: true
});
// Índices para BillingCycle
BillingCycleSchema.index({ nextBillingDate: 1, status: 1 });
exports.BillingInvoice = mongoose_1.default.model('BillingInvoice', BillingInvoiceSchema);
exports.BillingCycle = mongoose_1.default.model('BillingCycle', BillingCycleSchema);
//# sourceMappingURL=billing.model.js.map