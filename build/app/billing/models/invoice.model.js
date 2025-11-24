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
exports.Invoice = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InvoiceSchema = new mongoose_1.Schema({
    numero: { type: Number, required: true, min: 1 },
    puntoVenta: { type: Number, required: true, min: 1 },
    tipoComprobante: { type: Number, required: true },
    providerId: { type: String, required: true },
    subscriptionMonth: { type: String, required: true },
    plan: { type: String, enum: ['bronce', 'plata', 'gold'], required: true },
    total: { type: Number, required: true, min: 0 },
    cae: { type: String },
    caeVencimiento: { type: Date },
    estado: { type: String, enum: ["pendiente", "aprobada", "rechazada"], default: "pendiente" },
    fechaEmision: { type: Date, default: Date.now }
});
// Índices para optimización
InvoiceSchema.index({ numero: 1, puntoVenta: 1, tipoComprobante: 1 }, { unique: true });
InvoiceSchema.index({ providerId: 1 });
InvoiceSchema.index({ estado: 1 });
InvoiceSchema.index({ fechaEmision: 1 });
exports.Invoice = mongoose_1.default.model("Invoice", InvoiceSchema);
//# sourceMappingURL=invoice.model.js.map