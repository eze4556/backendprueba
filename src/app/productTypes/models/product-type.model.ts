import mongoose, { Schema, Document } from 'mongoose';

export interface IProductType extends Document {
    name: string;
    description: string;
    price: number;
    vatRate: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductTypeSchema = new Schema<IProductType>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    vatRate: {
        type: Number,
        required: true,
        default: 21
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const ProductType = mongoose.model<IProductType>('ProductType', ProductTypeSchema);