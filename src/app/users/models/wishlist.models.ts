import mongoose, { Schema, model } from 'mongoose';

export interface WishlistItemInterface {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  currentPrice: number;
  originalPrice?: number;
  addedAt: Date;
  priceAlertEnabled: boolean;
  alertThreshold?: number; // Precio al que enviar alerta
}

export interface WishlistInterface extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  items: WishlistItemInterface[];
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<WishlistItemInterface>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'products',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productImage: {
    type: String,
    required: false
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    required: false,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  priceAlertEnabled: {
    type: Boolean,
    default: false
  },
  alertThreshold: {
    type: Number,
    required: false,
    min: 0
  }
}, { _id: false });

const WishlistSchema = new Schema<WishlistInterface>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    unique: true,
    index: true
  },
  items: {
    type: [WishlistItemSchema],
    default: []
  }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  versionKey: false
});

// Índice para búsquedas de productos en la wishlist
WishlistSchema.index({ 'items.productId': 1 });

export default model<WishlistInterface>('wishlists', WishlistSchema);
