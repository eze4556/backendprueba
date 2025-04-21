import mongoose, { Schema, model } from 'mongoose';

export interface CategorieInterface extends mongoose.Document {
  categorie: string;
}

const CategorieSchema = new Schema(
  {
    categorie: { type: String, required: true },
    createdAt: { type: Number, inmutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export default model<CategorieInterface>('categories', CategorieSchema);
