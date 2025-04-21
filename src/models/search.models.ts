import mongoose, { Schema, Document } from 'mongoose';
import { SearchInterface } from '../interfaces/search.interface';

export interface ISearch extends Document, SearchInterface {}

const SearchSchema: Schema = new Schema({
  search: { type: [String], required: true },
  raw_search: { type: String, required: true },
});

export default mongoose.model<ISearch>('Search', SearchSchema);