import mongoose, { Document, Schema } from 'mongoose';

interface IDedicated extends Document {
    name: string;
    profession: string;
    experience: number;
    score: number; // Añadir este campo
    categorie: string;
}

const dedicatedSchema: Schema = new Schema({
    name: {
        type: String,
        required: true
    },
    profession: {
        type: String,
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true // Añadir este campo
    },
    categorie: {
        type: String,
        required: true
    }
});

const Dedicated = mongoose.model<IDedicated>('Dedicated', dedicatedSchema);

export default Dedicated;