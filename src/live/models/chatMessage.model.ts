import mongoose, { Schema, Document } from 'mongoose';

// Enum para tipos de mensaje
export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  EMOJI = 'emoji',
  GIFT = 'gift'
}

// Interface para el documento de Chat Message
export interface IChatMessage extends Document {
  streamId: string;
  userId: string;
  username: string;
  userRole?: string;
  message: string;
  messageType: MessageType;
  timestamp: Date;
  isDeleted: boolean;
  metadata?: {
    giftValue?: number;
    emojiCode?: string;
    replyTo?: string;
  };
}

// Schema de Mongoose
const ChatMessageSchema: Schema = new Schema(
  {
    streamId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    userRole: {
      type: String
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    metadata: {
      giftValue: {
        type: Number
      },
      emojiCode: {
        type: String
      },
      replyTo: {
        type: String
      }
    }
  },
  {
    timestamps: true,
    collection: 'chatMessages'
  }
);

// Índices compuestos para consultas eficientes
ChatMessageSchema.index({ streamId: 1, timestamp: -1 });
ChatMessageSchema.index({ userId: 1, streamId: 1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
