import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked'
}

export interface ConversationInterface extends Document {
  participants: ObjectId[];
  lastMessage?: {
    text: string;
    senderId: ObjectId;
    timestamp: Date;
  };
  unreadCount: Map<string, number>; // userId -> count
  status: ConversationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<ConversationInterface>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    lastMessage: {
      text: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date }
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },
    status: {
      type: String,
      enum: Object.values(ConversationStatus),
      default: ConversationStatus.ACTIVE
    }
  },
  {
    timestamps: true
  }
);

// Índices para búsquedas eficientes
ConversationSchema.index({ participants: 1, status: 1 });
ConversationSchema.index({ 'lastMessage.timestamp': -1 });

// Método para incrementar contador de no leídos
ConversationSchema.methods.incrementUnread = function(userId: string) {
  const current = this.unreadCount.get(userId) || 0;
  this.unreadCount.set(userId, current + 1);
  return this.save();
};

// Método para resetear contador de no leídos
ConversationSchema.methods.resetUnread = function(userId: string) {
  this.unreadCount.set(userId, 0);
  return this.save();
};

export default mongoose.model<ConversationInterface>('Conversation', ConversationSchema);
