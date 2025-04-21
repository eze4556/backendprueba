import { Request, Response } from 'express';
import ProductModel from '../models/productTypes.models'; 

export const getProductTypeDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productType = await ProductModel.findById(id);
        if (!productType) {
            return res.status(404).json({ message: 'Product type not found' });
        }
        res.json(productType);
    } catch (error) {
        const errorMessage = (error as Error).message;
        res.status(500).json({ message: 'Internal server error', error: errorMessage });
    }
};