import mongoose, { Schema, model } from 'mongoose';

export interface CodeInterface extends mongoose.Document {
  email: string;
  code: string;
  expiration: Date;
}

const CodeSchema = new Schema(
  {
    email: { type: String, required: true },
    code: { type: String, required: true },
    expiration: { type: Date, required: true },
    createdAt: { type: Number, immutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export default model<CodeInterface>('codes', CodeSchema);
