import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  AUDIO = 'audio'
}

export interface AttachmentInterface {
  type: MessageType;
  url: string;
  filename?: string;
  size?: number;
  thumbnail?: string;
}

export interface MessageInterface extends Document {
  conversationId: ObjectId;
  senderId: ObjectId;
  recipientId: ObjectId;
  text?: string;
  type: MessageType;
  attachments?: AttachmentInterface[];
  status: MessageStatus;
  readAt?: Date;
  deliveredAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<AttachmentInterface>(
  {
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number,
    thumbnail: String
  },
  { _id: false }
);

const MessageSchema = new Schema<MessageInterface>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    text: {
      type: String,
      maxlength: 5000
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT
    },
    attachments: [AttachmentSchema],
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT
    },
    readAt: Date,
    deliveredAt: Date,
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date
  },
  {
    timestamps: true
  }
);

// Índices compuestos
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, status: 1 });
MessageSchema.index({ recipientId: 1, status: 1 });

export default mongoose.model<MessageInterface>('Message', MessageSchema);
