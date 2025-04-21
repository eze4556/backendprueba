import { Schema, model } from 'mongoose';

const professionalSchema = new Schema({
  name: { type: String, required: true },
  profession: { type: String, required: true },
  experience: { type: Number, required: true },
  score: { type: Number, required: true }, // Añadir este campo
  categorie: { type: String, required: true }
});

export default model('Professional', professionalSchema);