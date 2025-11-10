import mongoose, { Schema, model, ObjectId } from 'mongoose';

export interface ProductInterface extends mongoose.Document {
  user: ObjectId;
  categorie: ObjectId;
  product_info: {
    name: string;
    description: string;
    stock: number;
    price: number;
    imageUrl?: string;
  };
  product_status: {
    status: string;
    payment: Array<String>;
    delivery: boolean;
  };
  product_access: {
    link: string;
    access: boolean;
  };
  tags: Array<String>;
  associate: Array<{ _id: ObjectId; date: number }>;
}

const ProductSchema = new Schema(
  {
    user: { type: mongoose.Types.ObjectId, required: true },
    categorie: { type: mongoose.Types.ObjectId, required: true },
    product_info: {
      name: { type: String, required: true },
      description: { type: String, required: true },
      stock: { type: Number, required: true },
      price: { type: Number, required: true },
      imageUrl: { type: String, required: false },
    },
    product_status: {
      status: { type: String, required: true },
      payment: { type: Array, required: true },
      delivery: { type: Boolean, required: true },
    },
    product_access: {
      link: { type: String, required: true },
      access: { type: Boolean, required: true },
    },
    tags: { type: Array, required: true },
    associate: [
      {
        _id: { type: mongoose.Types.ObjectId, required: true },
        createdAt: { type: Number, required: true },
      },
    ],
    createdAt: { type: Number, immutable: true },
    updatedAt: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

export default model<ProductInterface>('products', ProductSchema);