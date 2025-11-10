import mongoose, { Schema, model } from 'mongoose';

export interface RefreshTokenInterface extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ip?: string;
  userAgent?: string;
}

const RefreshTokenSchema = new Schema<RefreshTokenInterface>(
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
      // Nota: index TTL se define con .index() al final del schema
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    ip: {
      type: String,
      required: false
    },
    userAgent: {
      type: String,
      required: false
    }
  },
  { versionKey: false }
);

// Índice TTL para auto-eliminar tokens expirados
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<RefreshTokenInterface>('refresh_tokens', RefreshTokenSchema);
