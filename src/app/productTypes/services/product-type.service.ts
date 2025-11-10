import mongoose from 'mongoose';
import { ProductType, IProductType } from '../models/product-type.model';

export class ProductTypeService {
    async getById(id: string): Promise<IProductType> {
        const product = await ProductType.findById(id);
        if (!product) {
            throw new Error('Product type not found');
        }
        return product;
    }

    async create(data: Partial<IProductType>): Promise<IProductType> {
        const product = new ProductType(data);
        return await product.save();
    }

    async update(id: string, data: Partial<IProductType>): Promise<IProductType | null> {
        return await ProductType.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id: string): Promise<boolean> {
        const result = await ProductType.findByIdAndDelete(id);
        return result !== null;
    }

    async getAll(): Promise<IProductType[]> {
        return await ProductType.find();
    }

    async getActive(): Promise<IProductType[]> {
        return await ProductType.find({ active: true });
    }
}