import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  cliente: mongoose.Types.ObjectId;
  items: {
    producto: mongoose.Types.ObjectId;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    iva: number;
  }[];
  tipo: "producto" | "suscripcion";
  total: number;
  factura?: mongoose.Types.ObjectId;
  estado: "pendiente" | "pagada" | "cancelada";
  fecha: Date;
}

const OrderSchema = new Schema<IOrder>({
  cliente: { type: Schema.Types.ObjectId, ref: "Cliente", required: true },
  items: [
    {
      producto: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
      nombre: { type: String, required: true },
      cantidad: { type: Number, required: true },
      precioUnitario: { type: Number, required: true },
      iva: { type: Number, required: true }
    }
  ],
  tipo: { type: String, enum: ["producto", "suscripcion"], required: true },
  total: { type: Number, required: true },
  factura: { type: Schema.Types.ObjectId, ref: "Invoice" },
  estado: { type: String, enum: ["pendiente", "pagada", "cancelada"], default: "pendiente" },
  fecha: { type: Date, default: Date.now }
});

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
