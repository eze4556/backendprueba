import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import HttpHandler from '../helpers/handler.helper';
import { BAD_REQUEST } from '../constants/codes.constanst';
import { StockMovement } from '../app/productTypes/models/stock.models';


const logger = Logger.getInstance('StockValidation');

/**
 * Middleware para validar la integridad del stock en operaciones concurrentes
 */
export const validateStockIntegrity = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { operation, quantity } = req.body;
        const product = (req as any).product;

        if (!product) {
            return HttpHandler.error(res, {
                code: BAD_REQUEST,
                message: 'Producto no disponible para validación'
            });
        }

        // Obtener el último movimiento del stock
        const lastMovement = await StockMovement.findOne({
            productId: product._id
        })
        .sort({ createdAt: -1 })
        .select('finalStock');

        // Verificar que el stock actual coincide con el último movimiento
        if (lastMovement && lastMovement.finalStock !== product.product_info.stock) {
            logger.error('Inconsistencia detectada en stock', {
                productId: product._id,
                currentStock: product.product_info.stock,
                lastMovementStock: lastMovement.finalStock
            });

            return HttpHandler.error(res, {
                code: 409,
                message: 'Detectada inconsistencia en el stock del producto'
            });
        }

        // Verificar si hay operaciones pendientes
        const pendingMovements = await StockMovement.countDocuments({
            productId: product._id,
            status: 'pending'
        });

        if (pendingMovements > 0) {
            logger.warn('Operaciones pendientes detectadas', {
                productId: product._id,
                pendingMovements
            });

            return HttpHandler.error(res, {
                code: 409,
                message: 'Existen operaciones de stock pendientes'
            });
        }

        next();
    } catch (error) {
        logger.error('Error validando integridad del stock', error);
        return HttpHandler.error(res, {
            code: 500,
            message: 'Error validando integridad del stock'
        });
    }
};