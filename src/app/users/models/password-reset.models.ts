import mongoose, { Schema, model } from 'mongoose';

export interface PasswordResetInterface extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<PasswordResetInterface>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
      // Nota: Los índices se manejan explícitamente con .index() al final
    },
    used: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  { versionKey: false }
);

// Índice TTL para auto-eliminar tokens expirados después de 24 horas
PasswordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default model<PasswordResetInterface>('password_resets', PasswordResetSchema);
