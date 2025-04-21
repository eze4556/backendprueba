import mongoose, { Document, Schema } from 'mongoose';

interface IAutonomous extends Document {
    name: string;
    description: string;
    score: number; // Añadir este campo
    categorie: string;
}

const autonomousSchema: Schema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
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

const Autonomous = mongoose.model<IAutonomous>('Autonomous', autonomousSchema);

export default Autonomous;
