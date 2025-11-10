import mongoose, { Schema, model } from 'mongoose';

export interface ReviewInterface extends mongoose.Document {
  // Referencia a qué se está revisando
  productId?: mongoose.Types.ObjectId;
  professionalId?: mongoose.Types.ObjectId;
  
  // Autor del review
  userId: mongoose.Types.ObjectId;
  userName: string;
  userImage?: string;
  
  // Orden relacionada (para validar compra)
  orderId?: mongoose.Types.ObjectId;
  
  // Calificación y contenido
  rating: number; // 1-5 estrellas
  title?: string;
  comment: string;
  
  // Imágenes/videos del review
  images?: string[];
  
  // Verificación de compra
  verifiedPurchase: boolean;
  
  // Respuesta del vendedor/profesional
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: mongoose.Types.ObjectId;
  };
  
  // Interacciones
  likes: number;
  likedBy: mongoose.Types.ObjectId[];
  
  // Estado
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<ReviewInterface>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'products',
    required: false,
    index: true
  },
  professionalId: {
    type: Schema.Types.ObjectId,
    ref: 'professional',
    required: false,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    required: false
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'orders',
    required: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: false,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 2000
  },
  images: {
    type: [String],
    required: false,
    default: []
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  response: {
    text: { type: String, required: false },
    respondedAt: { type: Date, required: false },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'users', required: false }
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: {
    type: [Schema.Types.ObjectId],
    ref: 'users',
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved' // Auto-aprobar por defecto, moderar después si es necesario
  },
  flagReason: {
    type: String,
    required: false
  }
}, {
  timestamps: true,
  versionKey: false
});

// Índices para consultas eficientes
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ professionalId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });

// Validación: debe tener productId O professionalId, no ambos ni ninguno
ReviewSchema.pre('validate', function(next) {
  if (!this.productId && !this.professionalId) {
    next(new Error('Review must have either productId or professionalId'));
  } else if (this.productId && this.professionalId) {
    next(new Error('Review cannot have both productId and professionalId'));
  } else {
    next();
  }
});

export default model<ReviewInterface>('reviews', ReviewSchema);
