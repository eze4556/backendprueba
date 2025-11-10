"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productTypes_models_1 = __importDefault(require("../models/productTypes.models"));
const stock_movement_model_1 = require("../models/stock-movement.model");
class StockService {
    /**
     * Actualizar stock y registrar movimiento
     */
    async updateStock(data) {
        // Usar transacciones excepto en modo test
        const isTestEnvironment = process.env.NODE_ENV === 'test';
        const useTransactions = !isTestEnvironment;
        const session = useTransactions ? await mongoose_1.default.startSession() : null;
        if (useTransactions) {
            session.startTransaction();
        }
        try {
            const { productId, quantity, operation, reason, userId, userRole } = data;
            // Obtener el producto actual
            // Buscar el producto con o sin sesión
            const query = productTypes_models_1.default.findById(productId);
            const product = useTransactions ?
                await query.session(session) :
                await query;
            if (!product) {
                if (useTransactions) {
                    await session.abortTransaction();
                }
                return { success: false, error: 'Producto no encontrado' };
            }
            const previousStock = product.product_info.stock;
            let newStock = previousStock;
            // Calcular nuevo stock según la operación
            switch (operation) {
                case 'add':
                case 'purchase':
                    newStock = previousStock + quantity;
                    break;
                case 'subtract':
                case 'sale':
                    newStock = previousStock - quantity;
                    if (newStock < 0) {
                        if (useTransactions) {
                            await session.abortTransaction();
                        }
                        return {
                            success: false,
                            error: `Stock insuficiente. Stock actual: ${previousStock}, Cantidad solicitada: ${quantity}`
                        };
                    }
                    break;
                case 'set':
                case 'adjustment':
                    newStock = quantity;
                    break;
                default:
                    if (useTransactions) {
                        await session.abortTransaction();
                    }
                    return { success: false, error: 'Operación no válida' };
            }
            // Actualizar el producto
            const updateOptions = useTransactions ?
                { new: true, session: session } :
                { new: true };
            const updatedProduct = await productTypes_models_1.default.findByIdAndUpdate(productId, { $set: { 'product_info.stock': newStock } }, updateOptions);
            // Registrar el movimiento
            const movement = new stock_movement_model_1.StockMovement({
                productId: new mongoose_1.default.Types.ObjectId(productId),
                movementType: operation,
                quantity: Math.abs(quantity),
                previousStock,
                newStock,
                reason,
                userId: new mongoose_1.default.Types.ObjectId(userId),
                userRole
            });
            const saveOptions = useTransactions ? { session: session } : {};
            const savedMovement = await movement.save(saveOptions);
            if (useTransactions) {
                await session.commitTransaction();
            }
            return {
                success: true,
                product: updatedProduct,
                movement: savedMovement
            };
        }
        catch (error) {
            if (useTransactions) {
                await session.abortTransaction();
            }
            return {
                success: false,
                error: `Error al actualizar stock: ${error.message}`
            };
        }
        finally {
            if (useTransactions) {
                session.endSession();
            }
        }
    }
    /**
     * Obtener historial de movimientos de un producto
     */
    async getStockHistory(productId, limit = 50) {
        return await stock_movement_model_1.StockMovement.find({ productId })
            .populate({
            path: 'userId',
            select: 'primary_data.name primary_data.email',
            model: 'users'
        })
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    /**
     * Obtener stock actual de un producto
     */
    async getCurrentStock(productId) {
        const product = await productTypes_models_1.default.findById(productId);
        return product ? product.product_info.stock : null;
    }
    /**
     * Verificar si hay suficiente stock para una operación
     */
    async hasEnoughStock(productId, requestedQuantity) {
        const currentStock = await this.getCurrentStock(productId);
        if (currentStock === null) {
            return { hasEnough: false, currentStock: 0, shortage: requestedQuantity };
        }
        const hasEnough = currentStock >= requestedQuantity;
        const shortage = hasEnough ? 0 : requestedQuantity - currentStock;
        return { hasEnough, currentStock, shortage };
    }
    /**
     * Obtener productos con stock bajo (menos de un umbral)
     */
    async getLowStockProducts(threshold = 10) {
        return await productTypes_models_1.default.find({
            'product_info.stock': { $lt: threshold },
            'product_access.access': true
        }).select('product_info categorie user');
    }
    /**
     * Obtener estadísticas de stock
     */
    async getStockStatistics(productId) {
        const matchStage = productId ? { productId: new mongoose_1.default.Types.ObjectId(productId) } : {};
        const stats = await stock_movement_model_1.StockMovement.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$movementType',
                    count: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    avgQuantity: { $avg: '$quantity' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        return stats;
    }
}
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map