import mongoose, { Schema } from 'mongoose';

// Nuevo schema para productos con sellerId y sellerType
const PublicProductSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String },
    images: [{ type: String }],
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    sellerId: { type: String, required: true, index: true },
    sellerType: { type: String, required: true, enum: ['autonomous', 'dedicated', 'professional'], index: true }
  },
  { timestamps: true, versionKey: false, collection: 'producttypes' }
);

// Crear índice compuesto para búsquedas rápidas
PublicProductSchema.index({ sellerId: 1, sellerType: 1 });

export const PublicProduct = mongoose.model('PublicProduct', PublicProductSchema);
