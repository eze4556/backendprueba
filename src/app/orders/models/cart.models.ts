import mongoose, { Schema, model } from 'mongoose';

export interface CartItemInterface {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  subtotal: number;
  providerId: mongoose.Types.ObjectId;
}

export interface CartInterface extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  items: CartItemInterface[];
  totalItems: number;
  totalAmount: number;
  lastUpdated: Date;
  createdAt: Date;
}

const CartItemSchema = new Schema<CartItemInterface>({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, { _id: false });

const CartSchema = new Schema<CartInterface>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
      index: true
    },
    items: [CartItemSchema],
    totalItems: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  { versionKey: false }
);

// Middleware para calcular totales antes de guardar
CartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.totalAmount = this.items.reduce((acc, item) => acc + item.subtotal, 0);
  this.lastUpdated = new Date();
  next();
});

export default model<CartInterface>('carts', CartSchema);
