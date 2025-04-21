import mongoose, { Schema, model } from 'mongoose';

export interface SearchInterface extends mongoose.Document {
  search: Array<String>;
  raw_search: string;
}

const SearchSchema = new Schema(
  {
    search: { type: Array, required: true },
    raw_search: { type: String, required: true },
    createdAt: { type: Number, inmutable: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export default model<SearchInterface>('search', SearchSchema);
