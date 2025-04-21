import mongoose, { Schema, model } from 'mongoose';

export interface CodeInterface extends mongoose.Document {
  email: string;
  code: string;
  expiration: number;
}

const CodeSchema = new Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    expiration: { type: Number, required: true },
    createdAt: { type: Number, inmutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export default model<CodeInterface>('codes', CodeSchema);
