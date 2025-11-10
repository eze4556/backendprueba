import { Request, Response, NextFunction } from 'express';
import HttpHandler from '../helpers/handler.helper';
import { UNAUTHORIZED, FORBIDDEN, BAD_REQUEST } from '../constants/codes.constanst';
import ProductModel from '../app/productTypes/models/productTypes.models';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance('ProductValidation');

interface ValidationError {
    code: string;
    message: string;
    field?: string;
}

/**
 * Middleware para validar datos de producto antes de crear/actualizar
 */
export const validateProductData = (req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>> => {
    try {
        const errors: ValidationError[] = [];
        const { product_info } = req.body;

        if (!product_info) {
            return HttpHandler.error(res, {
                code: BAD_REQUEST,
                message: 'product_info es requerido',
                errors: [{
                    code: 'MISSING_PRODUCT_INFO',
                    message: 'product_info es requerido'
                }]
            });
        }

        // Validar campos requeridos
        if (!product_info.name || product_info.name.trim() === '') {
            errors.push({
                code: 'MISSING_NAME',
                message: 'El nombre del producto es requerido',
                field: 'name'
            });
        }

        if (!product_info.description || product_info.description.trim() === '') {
            errors.push({
                code: 'MISSING_DESCRIPTION',
                message: 'La descripción del producto es requerida',
                field: 'description'
            });
        }

        // Validar precio
        if (product_info.price !== undefined) {
            if (typeof product_info.price !== 'number') {
                errors.push({
                    code: 'INVALID_PRICE_TYPE',
                    message: 'El precio debe ser un número',
                    field: 'price'
                });
            } else if (product_info.price < 0) {
                errors.push({
                    code: 'NEGATIVE_PRICE',
                    message: 'El precio debe ser un número positivo',
                    field: 'price'
                });
            }
        }

        // Validar stock
        if (product_info.stock !== undefined) {
            if (typeof product_info.stock !== 'number') {
                errors.push({
                    code: 'INVALID_STOCK_TYPE',
                    message: 'El stock debe ser un número',
                    field: 'stock'
                });
            } else if (product_info.stock < 0) {
                errors.push({
                    code: 'NEGATIVE_STOCK',
                    message: 'El stock debe ser un número positivo o cero',
                    field: 'stock'
                });
            }
        }

        if (errors.length > 0) {
            logger.warn('Errores de validación de producto', { errors });
            return HttpHandler.error(res, {
                code: BAD_REQUEST,
                message: 'Validation Error',
                errors
            });
        }

        next();
    } catch (error) {
        logger.error('Error en validación de producto', error);
        return HttpHandler.error(res, {
            code: 500,
            message: 'Error validando datos del producto'
        });
    }
};

const VALID_OPERATIONS = ['add', 'subtract', 'set', 'sale', 'purchase', 'adjustment'] as const;
type StockOperation = typeof VALID_OPERATIONS[number];

/**
 * Middleware para validar operaciones de stock
 */
export const validateStockOperation = (req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>> => {
    try {
        const { quantity, operation } = req.body;
        const errors: ValidationError[] = [];

        if (!operation || !VALID_OPERATIONS.includes(operation as StockOperation)) {
            errors.push({
                code: 'INVALID_OPERATION',
                message: `Operación inválida. Debe ser: ${VALID_OPERATIONS.join(', ')}`,
                field: 'operation'
            });
        }

        if (quantity === undefined || typeof quantity !== 'number') {
            errors.push({
                code: 'INVALID_QUANTITY_TYPE',
                message: 'La cantidad debe ser un número',
                field: 'quantity'
            });
        } else {
            if (quantity <= 0 && ['add', 'subtract', 'sale', 'purchase'].includes(operation as StockOperation)) {
                errors.push({
                    code: 'INVALID_POSITIVE_QUANTITY',
                    message: 'La cantidad debe ser mayor a cero para esta operación',
                    field: 'quantity'
                });
            }

            if (quantity < 0 && ['set', 'adjustment'].includes(operation as StockOperation)) {
                errors.push({
                    code: 'NEGATIVE_QUANTITY',
                    message: 'La cantidad no puede ser negativa',
                    field: 'quantity'
                });
            }
        }

        if (errors.length > 0) {
            logger.warn('Errores de validación de operación de stock', { errors });
            return HttpHandler.error(res, {
                code: BAD_REQUEST,
                message: 'Validation Error',
                errors
            });
        }

        next();
    } catch (error) {
        logger.error('Error en validación de operación de stock', error);
        return HttpHandler.error(res, {
            code: 500,
            message: 'Error validando operación de stock'
        });
    }
};

/**
 * Middleware para verificar que el usuario es propietario del producto (para operaciones sensibles)
 */
export const validateProductOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;
        const userRole = (req as any).user?.role;
        const userFlags = (req as any).user?.flags;

        // Los admins pueden acceder a cualquier producto
        if (userRole === 'admin') {
            next();
            return;
        }

        // Proveedores y profesionales pueden modificar sus propios productos
        if (userFlags?.isProvider || userFlags?.isProfessional) {
            const product = await ProductModel.findById(id);
            if (!product) {
                return HttpHandler.error(res, {
                    code: 404,
                    message: 'Producto no encontrado'
                });
            }

            // Verificar si el usuario es propietario del producto
            if (product.user.toString() !== userId) {
                logger.warn('Intento de acceso no autorizado a producto', {
                    userId,
                    productId: id,
                    userRole,
                    userFlags
                });
                
                return HttpHandler.error(res, {
                    code: FORBIDDEN,
                    message: 'No tienes permisos para modificar este producto'
                });
            }

            next();
            return;
        }

        // Si no es admin, proveedor o profesional, no puede modificar productos
        return HttpHandler.error(res, {
            code: FORBIDDEN,
            message: 'No tienes privilegios suficientes para esta operación'
        });
    } catch (error) {
        logger.error('Error verificando propiedad del producto', error);
        return HttpHandler.error(res, {
            code: 500,
            message: 'Error verificando propiedad del producto'
        });
    }
};

/**
 * Middleware para validar que un producto existe
 */
export const validateProductExists = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const { id } = req.params;

        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return HttpHandler.error(res, {
                code: BAD_REQUEST,
                message: 'ID de producto inválido'
            });
        }

        const product = await ProductModel.findById(id);
        if (!product) {
            return HttpHandler.error(res, {
                code: 404,
                message: 'Producto no encontrado'
            });
        }

        // Agregar el producto al request para uso posterior
        (req as any).product = product;
        next();
    } catch (error) {
        logger.error('Error verificando existencia del producto', error);
        return HttpHandler.error(res, {
            code: 500,
            message: 'Error verificando existencia del producto'
        });
    }
};

/**
 * Middleware para verificar stock mínimo en operaciones de venta
 */
export const validateMinimumStock = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const { operation, quantity } = req.body;
        const product = (req as any).product;

        // Solo verificar para operaciones de venta o reducción de stock
        if (!['subtract', 'sale'].includes(operation as StockOperation)) {
            next();
            return;
        }

        if (!product) {
            return HttpHandler.error(res, {
                code: 500,
                message: 'Producto no disponible para validación de stock'
            });
        }

        const currentStock = product.product_info.stock || 0;
        const minimumStock = product.product_info.minimum_stock || 0;
        const resultingStock = currentStock - quantity;

        if (resultingStock < minimumStock) {
            logger.warn('Intento de reducir stock por debajo del mínimo', {
                productId: product._id,
                currentStock,
                minimumStock,
                quantity,
                resultingStock
            });

            return HttpHandler.error(res, {
                code: BAD_REQUEST,
                message: 'La operación resultaría en un stock por debajo del mínimo permitido',
                errors: [{
                    currentStock,
                    minimumStock,
                    resultingStock
                }]
            });
        }

        next();
    } catch (error) {
        logger.error('Error validando stock mínimo', error);
        return HttpHandler.error(res, {
            code: 500,
            message: 'Error validando stock mínimo'
        });
    }
};