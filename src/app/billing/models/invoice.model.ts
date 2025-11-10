import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  numero: number;
  puntoVenta: number;
  tipoComprobante: number;
  providerId: string;
  subscriptionMonth: string;
  plan: 'bronce' | 'plata' | 'gold';
  total: number;
  cae?: string;
  caeVencimiento?: Date;
  estado: "pendiente" | "aprobada" | "rechazada";
  fechaEmision: Date;
  items?: any[]; // Si necesitas mantener la referencia a productos
}

const InvoiceSchema = new Schema<IInvoice>({
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

export const Invoice = mongoose.model<IInvoice>("Invoice", InvoiceSchema);
