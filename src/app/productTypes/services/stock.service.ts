import mongoose from 'mongoose';
import ProductModel from '../models/productTypes.models';
import { StockMovement, IStockMovement } from '../models/stock-movement.model';

export interface StockUpdateData {
    productId: string;
    quantity: number;
    operation: 'add' | 'subtract' | 'set' | 'sale' | 'purchase' | 'adjustment';
    reason?: string;
    userId: string;
    userRole: string;
}

export class StockService {
    /**
     * Actualizar stock y registrar movimiento
     */
    async updateStock(data: StockUpdateData): Promise<{
        success: boolean;
        product?: any;
        movement?: IStockMovement;
        error?: string;
    }> {
        // Usar transacciones excepto en modo test
        const isTestEnvironment = process.env.NODE_ENV === 'test';
        const useTransactions = !isTestEnvironment;
        const session = useTransactions ? await mongoose.startSession() : null;
        
        if (useTransactions) {
            session!.startTransaction();
        }

        try {
            const { productId, quantity, operation, reason, userId, userRole } = data;

            // Obtener el producto actual
            // Buscar el producto con o sin sesión
            const query = ProductModel.findById(productId);
            const product = useTransactions ? 
                await query.session(session!) :
                await query;

            if (!product) {
                if (useTransactions) {
                    await session!.abortTransaction();
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
                            await session!.abortTransaction();
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
                        await session!.abortTransaction();
                    }
                    return { success: false, error: 'Operación no válida' };
            }

            // Actualizar el producto
            const updateOptions = useTransactions ? 
                { new: true, session: session! } :
                { new: true };
            
            const updatedProduct = await ProductModel.findByIdAndUpdate(
                productId,
                { $set: { 'product_info.stock': newStock } },
                updateOptions
            );

            // Registrar el movimiento
            const movement = new StockMovement({
                productId: new mongoose.Types.ObjectId(productId),
                movementType: operation,
                quantity: Math.abs(quantity),
                previousStock,
                newStock,
                reason,
                userId: new mongoose.Types.ObjectId(userId),
                userRole
            });

            const saveOptions = useTransactions ? { session: session! } : {};
            const savedMovement = await movement.save(saveOptions);

            if (useTransactions) {
                await session!.commitTransaction();
            }

            return {
                success: true,
                product: updatedProduct,
                movement: savedMovement
            };

        } catch (error) {
            if (useTransactions) {
                await session!.abortTransaction();
            }
            return { 
                success: false, 
                error: `Error al actualizar stock: ${(error as Error).message}` 
            };
        } finally {
            if (useTransactions) {
                session!.endSession();
            }
        }
    }

    /**
     * Obtener historial de movimientos de un producto
     */
    async getStockHistory(productId: string, limit: number = 50): Promise<IStockMovement[]> {
        return await StockMovement.find({ productId })
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
    async getCurrentStock(productId: string): Promise<number | null> {
        const product = await ProductModel.findById(productId);
        return product ? product.product_info.stock : null;
    }

    /**
     * Verificar si hay suficiente stock para una operación
     */
    async hasEnoughStock(productId: string, requestedQuantity: number): Promise<{
        hasEnough: boolean;
        currentStock: number;
        shortage: number;
    }> {
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
    async getLowStockProducts(threshold: number = 10): Promise<any[]> {
        return await ProductModel.find({
            'product_info.stock': { $lt: threshold },
            'product_access.access': true
        }).select('product_info categorie user');
    }

    /**
     * Obtener estadísticas de stock
     */
    async getStockStatistics(productId?: string): Promise<any> {
        const matchStage = productId ? { productId: new mongoose.Types.ObjectId(productId) } : {};

        const stats = await StockMovement.aggregate([
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