import mongoose, { Schema, Document } from 'mongoose';

// Enum para el estado del stream
export enum StreamStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  ENDED = 'ended',
  PAUSED = 'paused'
}

// Enum para la calidad del stream
export enum StreamQuality {
  LOW = '480p',
  MEDIUM = '720p',
  HIGH = '1080p',
  ULTRA = '4K'
}

// Interface para el participante/viewer
export interface IViewer {
  userId: string;
  username: string;
  joinedAt: Date;
  socketId: string;
  isActive: boolean;
}

// Interface para el documento de Stream
export interface IStream extends Document {
  streamId: string;
  title: string;
  description?: string;
  streamer: {
    userId: mongoose.Types.ObjectId;
    username: string;
    role: string;
  };
  status: StreamStatus;
  quality: StreamQuality;
  viewers: IViewer[];
  viewerCount: number;
  maxViewers: number;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // en segundos
  thumbnailUrl?: string;
  isPrivate: boolean;
  allowedViewers?: string[]; // IDs de usuarios permitidos si es privado
  tags?: string[];
  category?: string;
  role?: string;
  product?: string;
  productType?: string;
  productStatus?: string;
  location?: string;
  metadata: {
    totalViews: number;
    peakViewers: number;
    averageViewTime: number;
    chatEnabled: boolean;
    recordingEnabled: boolean;
  };
  webrtc: {
    roomId: string;
    signalData?: any;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  addViewer(viewerData: IViewer): Promise<this>;
  removeViewer(userId: string): Promise<this>;
  startStream(): Promise<this>;
  endStream(): Promise<this>;
}

// Schema de Mongoose
const StreamSchema: Schema = new Schema(
  {
    streamId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    streamer: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      username: {
        type: String,
        required: true
      },
      role: {
        type: String,
        required: true
      }
    },
    status: {
      type: String,
      enum: Object.values(StreamStatus),
      default: StreamStatus.WAITING
    },
    quality: {
      type: String,
      enum: Object.values(StreamQuality),
      default: StreamQuality.MEDIUM
    },
    viewers: [{
      userId: {
        type: String,
        required: true
      },
      username: {
        type: String,
        required: true
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      socketId: {
        type: String,
        required: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    viewerCount: {
      type: Number,
      default: 0
    },
    maxViewers: {
      type: Number,
      default: 1000
    },
    startedAt: {
      type: Date
    },
    endedAt: {
      type: Date
    },
    duration: {
      type: Number,
      default: 0
    },
    thumbnailUrl: {
      type: String
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowedViewers: [{
      type: String
    }],
    tags: [{
      type: String,
      maxlength: 50
    }],
    category: {
      type: String
    },
    role: {
      type: String
    },
    product: {
      type: String
    },
    productType: {
      type: String
    },
    productStatus: {
      type: String
    },
    location: {
      type: String,
      index: true
    },
    metadata: {
      totalViews: {
        type: Number,
        default: 0
      },
      peakViewers: {
        type: Number,
        default: 0
      },
      averageViewTime: {
        type: Number,
        default: 0
      },
      chatEnabled: {
        type: Boolean,
        default: true
      },
      recordingEnabled: {
        type: Boolean,
        default: false
      }
    },
    webrtc: {
      roomId: {
        type: String,
        required: true
      },
      signalData: {
        type: Schema.Types.Mixed
      }
    }
  },
  {
    timestamps: true,
    collection: 'streams'
  }
);

// Índices para mejorar el rendimiento de consultas
StreamSchema.index({ 'streamer.userId': 1 });
StreamSchema.index({ status: 1 });
StreamSchema.index({ createdAt: -1 });
StreamSchema.index({ viewerCount: -1 });
StreamSchema.index({ category: 1, status: 1 });
StreamSchema.index({ role: 1 });
StreamSchema.index({ product: 1 });
StreamSchema.index({ productType: 1 });
StreamSchema.index({ productStatus: 1 });
StreamSchema.index({ location: 1 });

// Método para agregar un viewer
StreamSchema.methods.addViewer = async function(viewerData: IViewer) {
  // Verificar si el viewer ya existe
  const existingViewer = this.viewers.find(
    (v: IViewer) => v.userId === viewerData.userId
  );
  
  if (!existingViewer) {
    this.viewers.push(viewerData);
    this.viewerCount = this.viewers.filter((v: IViewer) => v.isActive).length;
    
    // Actualizar estadísticas
    this.metadata.totalViews++;
    if (this.viewerCount > this.metadata.peakViewers) {
      this.metadata.peakViewers = this.viewerCount;
    }
    
    await this.save();
  }
  
  return this;
};

// Método para remover un viewer
StreamSchema.methods.removeViewer = async function(userId: string) {
  const viewerIndex = this.viewers.findIndex(
    (v: IViewer) => v.userId === userId
  );
  
  if (viewerIndex !== -1) {
    this.viewers[viewerIndex].isActive = false;
    this.viewerCount = this.viewers.filter((v: IViewer) => v.isActive).length;
    await this.save();
  }
  
  return this;
};

// Método para iniciar el stream
StreamSchema.methods.startStream = async function() {
  this.status = StreamStatus.LIVE;
  this.startedAt = new Date();
  await this.save();
  return this;
};

// Método para finalizar el stream
StreamSchema.methods.endStream = async function() {
  this.status = StreamStatus.ENDED;
  this.endedAt = new Date();
  
  if (this.startedAt) {
    this.duration = Math.floor(
      (this.endedAt.getTime() - this.startedAt.getTime()) / 1000
    );
  }
  
  // Calcular tiempo promedio de visualización
  const activeViewers = this.viewers.filter((v: IViewer) => v.isActive);
  if (activeViewers.length > 0 && this.duration > 0) {
    this.metadata.averageViewTime = Math.floor(this.duration / activeViewers.length);
  }
  
  await this.save();
  return this;
};

export default mongoose.model<IStream>('Stream', StreamSchema);



