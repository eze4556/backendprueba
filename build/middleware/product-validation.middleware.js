"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMinimumStock = exports.validateProductExists = exports.validateProductOwnership = exports.validateStockOperation = exports.validateProductData = void 0;
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const codes_constanst_1 = require("../constants/codes.constanst");
const productTypes_models_1 = __importDefault(require("../app/productTypes/models/productTypes.models"));
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getInstance('ProductValidation');
/**
 * Middleware para validar datos de producto antes de crear/actualizar
 */
const validateProductData = (req, res, next) => {
    try {
        const errors = [];
        const { product_info } = req.body;
        if (!product_info) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
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
            }
            else if (product_info.price < 0) {
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
            }
            else if (product_info.stock < 0) {
                errors.push({
                    code: 'NEGATIVE_STOCK',
                    message: 'El stock debe ser un número positivo o cero',
                    field: 'stock'
                });
            }
        }
        if (errors.length > 0) {
            logger.warn('Errores de validación de producto', { errors });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'Validation Error',
                errors
            });
        }
        next();
    }
    catch (error) {
        logger.error('Error en validación de producto', error);
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error validando datos del producto'
        });
    }
};
exports.validateProductData = validateProductData;
const VALID_OPERATIONS = ['add', 'subtract', 'set', 'sale', 'purchase', 'adjustment'];
/**
 * Middleware para validar operaciones de stock
 */
const validateStockOperation = (req, res, next) => {
    try {
        const { quantity, operation } = req.body;
        const errors = [];
        if (!operation || !VALID_OPERATIONS.includes(operation)) {
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
        }
        else {
            if (quantity <= 0 && ['add', 'subtract', 'sale', 'purchase'].includes(operation)) {
                errors.push({
                    code: 'INVALID_POSITIVE_QUANTITY',
                    message: 'La cantidad debe ser mayor a cero para esta operación',
                    field: 'quantity'
                });
            }
            if (quantity < 0 && ['set', 'adjustment'].includes(operation)) {
                errors.push({
                    code: 'NEGATIVE_QUANTITY',
                    message: 'La cantidad no puede ser negativa',
                    field: 'quantity'
                });
            }
        }
        if (errors.length > 0) {
            logger.warn('Errores de validación de operación de stock', { errors });
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'Validation Error',
                errors
            });
        }
        next();
    }
    catch (error) {
        logger.error('Error en validación de operación de stock', error);
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error validando operación de stock'
        });
    }
};
exports.validateStockOperation = validateStockOperation;
/**
 * Middleware para verificar que el usuario es propietario del producto (para operaciones sensibles)
 */
const validateProductOwnership = async (req, res, next) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
        const userFlags = (_c = req.user) === null || _c === void 0 ? void 0 : _c.flags;
        // Los admins pueden acceder a cualquier producto
        if (userRole === 'admin') {
            next();
            return;
        }
        // Proveedores y profesionales pueden modificar sus propios productos
        if ((userFlags === null || userFlags === void 0 ? void 0 : userFlags.isProvider) || (userFlags === null || userFlags === void 0 ? void 0 : userFlags.isProfessional)) {
            const product = await productTypes_models_1.default.findById(id);
            if (!product) {
                return handler_helper_1.default.error(res, {
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
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.FORBIDDEN,
                    message: 'No tienes permisos para modificar este producto'
                });
            }
            next();
            return;
        }
        // Si no es admin, proveedor o profesional, no puede modificar productos
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.FORBIDDEN,
            message: 'No tienes privilegios suficientes para esta operación'
        });
    }
    catch (error) {
        logger.error('Error verificando propiedad del producto', error);
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error verificando propiedad del producto'
        });
    }
};
exports.validateProductOwnership = validateProductOwnership;
/**
 * Middleware para validar que un producto existe
 */
const validateProductExists = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'ID de producto inválido'
            });
        }
        const product = await productTypes_models_1.default.findById(id);
        if (!product) {
            return handler_helper_1.default.error(res, {
                code: 404,
                message: 'Producto no encontrado'
            });
        }
        // Agregar el producto al request para uso posterior
        req.product = product;
        next();
    }
    catch (error) {
        logger.error('Error verificando existencia del producto', error);
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error verificando existencia del producto'
        });
    }
};
exports.validateProductExists = validateProductExists;
/**
 * Middleware para verificar stock mínimo en operaciones de venta
 */
const validateMinimumStock = async (req, res, next) => {
    try {
        const { operation, quantity } = req.body;
        const product = req.product;
        // Solo verificar para operaciones de venta o reducción de stock
        if (!['subtract', 'sale'].includes(operation)) {
            next();
            return;
        }
        if (!product) {
            return handler_helper_1.default.error(res, {
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
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'La operación resultaría en un stock por debajo del mínimo permitido',
                errors: [{
                        currentStock,
                        minimumStock,
                        resultingStock
                    }]
            });
        }
        next();
    }
    catch (error) {
        logger.error('Error validando stock mínimo', error);
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Error validando stock mínimo'
        });
    }
};
exports.validateMinimumStock = validateMinimumStock;
//# sourceMappingURL=product-validation.middleware.js.map