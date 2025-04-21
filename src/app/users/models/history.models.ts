import mongoose, { Schema, model } from 'mongoose';

export interface HistoryInterface extends mongoose.Document {
  email: string;
  log: string;
}

const HistorySchema = new Schema(
  {
    email: { type: String, required: true },
    log: { type: String, required: true },
    createdAt: { type: Number, inmutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export default model<HistoryInterface>('history', HistorySchema);
