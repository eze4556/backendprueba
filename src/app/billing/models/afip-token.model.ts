import mongoose, { Schema, Document } from "mongoose";

export interface IAfipToken extends Document {
  token: string;
  sign: string;
  expiresAt: Date;
  environment: "homologacion" | "produccion";
  createdAt: Date;
}

const AfipTokenSchema = new Schema<IAfipToken>({
  token: { type: String, required: true },
  sign: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  environment: { 
    type: String,
    enum: ["homologacion", "produccion"],
    required: true 
  }
}, { timestamps: true });

export const AfipToken = mongoose.model<IAfipToken>("AfipToken", AfipTokenSchema);