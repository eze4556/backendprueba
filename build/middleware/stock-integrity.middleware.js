"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStockIntegrity = void 0;
const logger_1 = require("../utils/logger");
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const codes_constanst_1 = require("../constants/codes.constanst");
const stock_models_1 = require("../app/productTypes/models/stock.models");
const logger = logger_1.Logger.getInstance('StockValidation');
/**
 * Middleware para validar la integridad del stock en operaciones concurrentes
 */
const validateStockIntegrity = async (req, res, next) => {
    try {
        const { operation, quantity } = req.body;
        const product = req.product;
        if (!product) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'Producto no disponible para validación'
            });
        }
        // Obtener el último movimiento del stock
        const lastMovement = await stock_models_1.StockMovement.findOne({
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
            return handler_helper_1.default.error(res, {
                code: 409,
                message: 'Detectada inconsistencia en el stock del producto'
            });
        }
        // Verificar si hay operaciones pendientes
        const pendingMovements = await stock_models_1.StockMovement.countDocuments({
            productId: product._id,
            status: 'pending'
        });
        if (pendingMovements > 0) {
            logger.warn('Operaciones pendientes detectadas', {
                productId: product._id,
                pendingMovements
            });
            return handler_helper_1.default.error(res, {
                code: 409,
                message: 'Existen operaciones de stock pendientes'
            });
        }
        next();
    }
    catch (error) {
        logger.error('Error validando integridad del stock', error);
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error validando integridad del stock'
        });
    }
};
exports.validateStockIntegrity = validateStockIntegrity;
//# sourceMappingURL=stock-integrity.middleware.js.map