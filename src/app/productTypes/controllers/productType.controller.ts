import { Request, Response } from 'express';
import HttpHandler from '../../../helpers/handler.helper';
import { CREATED, SUCCESS, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import ProductModel from '../models/productTypes.models';
import SearchModel, { ISearch } from "../../../models/search.models";
import { SearchInterface } from '../../../interfaces/search.interface';
import searchTool from '../../../tools/search.tools';
import { StockService } from '../services/stock.service';
import mongoose from 'mongoose';
import moment from 'moment';

const productTypes = [
  { id: 1, name: 'Electronics', imageUrl: '/public/images/electronics.jpg' },
  { id: 2, name: 'Clothing', imageUrl: '/public/images/clothing.jpg' },
  { id: 3, name: 'Books', imageUrl: '/public/images/books.jpg' },
  { id: 4, name: 'Furniture', imageUrl: '/public/images/furniture.jpg' },
  { id: 5, name: 'Toys', imageUrl: '/public/images/toys.jpg' },
];

export const getProductTypes = (req: Request, res: Response) => {
  res.json(productTypes);
};

export const createProductType = async (req: Request, res: Response) => {
  try {
    const { product_info } = req.body;
    
    if (!product_info) {
      return HttpHandler.error(res, {
        code: 400,
        message: 'product_info es requerido',
      });
    }

    // Validar precio
    if (product_info.price !== undefined && (typeof product_info.price !== 'number' || product_info.price < 0)) {
      return HttpHandler.error(res, {
        code: 400,
        message: 'El precio debe ser un número positivo',
      });
    }

    // Validar stock
    if (product_info.stock !== undefined && (typeof product_info.stock !== 'number' || product_info.stock < 0)) {
      return HttpHandler.error(res, {
        code: 400,
        message: 'El stock debe ser un número positivo o cero',
      });
    }

    const newProduct = new ProductModel(req.body);
    
    if (req.file) {
      newProduct.product_info.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const savedProduct = await newProduct.save();
    
    return HttpHandler.success(res, {
      message: 'Producto creado exitosamente',
      data: savedProduct
    }, CREATED);
  } catch (e) {
    const error = e as Error;
    if (error.name === 'ValidationError') {
      return HttpHandler.error(res, {
        code: 400,
        message: 'Error de validación',
        errors: [error.message]
      });
    }
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Error interno del servidor',
      errors: [error.message]
    });
  }
};

export const changeAccess = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { access } = req.body.product_access;
    const product = await ProductModel.findByIdAndUpdate(req.body._id, { $set: { 'product_access.access': access } }); // Find by id and update product access
    return HttpHandler.success(res, {
      message: 'Product access edited successfully',
      data: { _id: product?._id },
    });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const search = async (req: Request, res: Response): Promise<Response> => {
  try {
    const raw_search = req.body.search;
    // Parse search and remove black list items
    const search = searchTool.parseSearch(raw_search);
    // Save search and raw search
    const registerSearch: ISearch = new SearchModel({ search, raw_search });
    await registerSearch.save();
    // Product aggregation
    const products = await ProductModel.aggregate([
// ... (el resto de la agregación)
    ]);

    return HttpHandler.success(res, { products });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const associateProductType = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { _id } = req;
    const { product_id } = req.body;
    const product = await ProductModel.updateOne(
      { _id: new mongoose.Types.ObjectId(product_id) },
      { $addToSet: { associate: { _id: new mongoose.Types.ObjectId(_id), createdAt: moment() } } }
    );
    return HttpHandler.success(res, { message: 'Association successfully', data: { product } });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const getAllProductTypes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { _id } = req; // Extract _id from token
    // Get all products from user
    const products = await ProductModel.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categorie',
          foreignField: '_id',
          as: 'categorie',
        },
      },
      {
        $unwind: {
          path: '$categorie',
          includeArrayIndex: 'categorie._id',
        },
      },
      {
        $project: {
          categorie: '$categorie.categorie',
          product_info: 1,
          product_access: 1,
        },
      },
    ]);
    return HttpHandler.success(res, { products });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const updateProductType = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validar que el producto existe
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      return HttpHandler.error(res, {
        code: 404,
        message: 'El producto no existe'
      });
    }

    // Validar stock si se está actualizando
    if (updateData.product_info?.stock !== undefined) {
      if (updateData.product_info.stock < 0) {
        return HttpHandler.error(res, {
          code: 400,
          message: 'El stock no puede ser negativo'
        });
      }
    }

    // Crear objeto de actualización aplanado para actualizaciones parciales
    const updateObj: any = {};
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'object' && updateData[key] !== null) {
        // Para objetos anidados, aplanar los paths
        Object.keys(updateData[key]).forEach(subKey => {
          updateObj[`${key}.${subKey}`] = updateData[key][subKey];
        });
      } else {
        updateObj[key] = updateData[key];
      }
    });

    // Actualizar el producto
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $set: updateObj },
      { new: true }
    );

    return HttpHandler.success(res, {
      message: 'Producto actualizado exitosamente',
      data: { product: updatedProduct }
    });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const deleteProductType = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    
    // Verificar que el producto existe
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      return HttpHandler.error(res, {
        code: 404,
        message: 'El producto no existe'
      });
    }

    // Eliminar el producto
    await ProductModel.findByIdAndDelete(id);

    return HttpHandler.success(res, {
      message: 'Producto eliminado exitosamente',
      data: { deletedId: id }
    });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const updateStock = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;
    const userId = (req as any).user?._id || (req as any).user?.id;
    const userRole = (req as any).user?.role || 'user';
    
    const stockService = new StockService();
    
    const result = await stockService.updateStock({
      productId: id,
      quantity,
      operation,
      reason,
      userId,
      userRole
    });

    if (!result.success) {
      return HttpHandler.error(res, {
        code: 400,
        message: 'Stock update failed',
        errors: [result.error]
      });
    }

    return HttpHandler.success(res, { 
        message: 'Stock updated successfully',
        product: result.product,
        movement: result.movement
    });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const getStockHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    
    const stockService = new StockService();
    const history = await stockService.getStockHistory(id, limit ? parseInt(limit as string) : 50);

    return HttpHandler.success(res, { 
      message: 'Stock history retrieved successfully',
      history 
    });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};

export const getLowStockProducts = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { threshold } = req.query;
    
    const stockService = new StockService();
    const products = await stockService.getLowStockProducts(threshold ? parseInt(threshold as string) : 10);

    return HttpHandler.success(res, { 
      message: 'Low stock products retrieved successfully',
      products, 
      threshold: threshold ? parseInt(threshold as string) : 10 
    });
  } catch (e) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: 'Internal Error',
      errors: [(e as Error).message]
    });
  }
};