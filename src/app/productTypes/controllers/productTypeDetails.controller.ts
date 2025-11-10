import { Request, Response } from 'express';
import ProductModel from '../models/productTypes.models';
import HttpHandler from '../../../helpers/handler.helper';

export const getProductTypeDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productType = await ProductModel.findById(id);
        if (!productType) {
            return res.status(404).json({ message: 'Product type not found' });
        }
        return HttpHandler.success(res, productType);
    } catch (error) {
        const errorMessage = (error as Error).message;
        return HttpHandler.error(res, {
            code: 500,
            message: 'Internal server error',
            errors: [errorMessage]
        });
    }
};