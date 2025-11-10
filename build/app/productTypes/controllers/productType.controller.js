"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLowStockProducts = exports.getStockHistory = exports.updateStock = exports.deleteProductType = exports.updateProductType = exports.getAllProductTypes = exports.associateProductType = exports.search = exports.changeAccess = exports.createProductType = exports.getProductTypes = void 0;
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const productTypes_models_1 = __importDefault(require("../models/productTypes.models"));
const search_models_1 = __importDefault(require("../../../models/search.models"));
const search_tools_1 = __importDefault(require("../../../tools/search.tools"));
const stock_service_1 = require("../services/stock.service");
const mongoose_1 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
const productTypes = [
    { id: 1, name: 'Electronics', imageUrl: '/public/images/electronics.jpg' },
    { id: 2, name: 'Clothing', imageUrl: '/public/images/clothing.jpg' },
    { id: 3, name: 'Books', imageUrl: '/public/images/books.jpg' },
    { id: 4, name: 'Furniture', imageUrl: '/public/images/furniture.jpg' },
    { id: 5, name: 'Toys', imageUrl: '/public/images/toys.jpg' },
];
const getProductTypes = (req, res) => {
    res.json(productTypes);
};
exports.getProductTypes = getProductTypes;
const createProductType = async (req, res) => {
    try {
        const { product_info } = req.body;
        if (!product_info) {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'product_info es requerido',
            });
        }
        // Validar precio
        if (product_info.price !== undefined && (typeof product_info.price !== 'number' || product_info.price < 0)) {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'El precio debe ser un número positivo',
            });
        }
        // Validar stock
        if (product_info.stock !== undefined && (typeof product_info.stock !== 'number' || product_info.stock < 0)) {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'El stock debe ser un número positivo o cero',
            });
        }
        const newProduct = new productTypes_models_1.default(req.body);
        if (req.file) {
            newProduct.product_info.imageUrl = `/uploads/${req.file.filename}`;
        }
        const savedProduct = await newProduct.save();
        return handler_helper_1.default.success(res, {
            message: 'Producto creado exitosamente',
            data: savedProduct
        }, codes_constanst_1.CREATED);
    }
    catch (e) {
        const error = e;
        if (error.name === 'ValidationError') {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'Error de validación',
                errors: [error.message]
            });
        }
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Error interno del servidor',
            errors: [error.message]
        });
    }
};
exports.createProductType = createProductType;
const changeAccess = async (req, res) => {
    try {
        const { access } = req.body.product_access;
        const product = await productTypes_models_1.default.findByIdAndUpdate(req.body._id, { $set: { 'product_access.access': access } }); // Find by id and update product access
        return handler_helper_1.default.success(res, {
            message: 'Product access edited successfully',
            data: { _id: product === null || product === void 0 ? void 0 : product._id },
        });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.changeAccess = changeAccess;
const search = async (req, res) => {
    try {
        const raw_search = req.body.search;
        // Parse search and remove black list items
        const search = search_tools_1.default.parseSearch(raw_search);
        // Save search and raw search
        const registerSearch = new search_models_1.default({ search, raw_search });
        await registerSearch.save();
        // Product aggregation
        const products = await productTypes_models_1.default.aggregate([
        // ... (el resto de la agregación)
        ]);
        return handler_helper_1.default.success(res, { products });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.search = search;
const associateProductType = async (req, res) => {
    try {
        const { _id } = req;
        const { product_id } = req.body;
        const product = await productTypes_models_1.default.updateOne({ _id: new mongoose_1.default.Types.ObjectId(product_id) }, { $addToSet: { associate: { _id: new mongoose_1.default.Types.ObjectId(_id), createdAt: (0, moment_1.default)() } } });
        return handler_helper_1.default.success(res, { message: 'Association successfully', data: { product } });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.associateProductType = associateProductType;
const getAllProductTypes = async (req, res) => {
    try {
        const { _id } = req; // Extract _id from token
        // Get all products from user
        const products = await productTypes_models_1.default.aggregate([
            {
                $match: {
                    user: new mongoose_1.default.Types.ObjectId(_id),
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
        return handler_helper_1.default.success(res, { products });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.getAllProductTypes = getAllProductTypes;
const updateProductType = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Validar que el producto existe
        const existingProduct = await productTypes_models_1.default.findById(id);
        if (!existingProduct) {
            return handler_helper_1.default.error(res, {
                code: 404,
                message: 'El producto no existe'
            });
        }
        // Validar stock si se está actualizando
        if (((_a = updateData.product_info) === null || _a === void 0 ? void 0 : _a.stock) !== undefined) {
            if (updateData.product_info.stock < 0) {
                return handler_helper_1.default.error(res, {
                    code: 400,
                    message: 'El stock no puede ser negativo'
                });
            }
        }
        // Crear objeto de actualización aplanado para actualizaciones parciales
        const updateObj = {};
        Object.keys(updateData).forEach(key => {
            if (typeof updateData[key] === 'object' && updateData[key] !== null) {
                // Para objetos anidados, aplanar los paths
                Object.keys(updateData[key]).forEach(subKey => {
                    updateObj[`${key}.${subKey}`] = updateData[key][subKey];
                });
            }
            else {
                updateObj[key] = updateData[key];
            }
        });
        // Actualizar el producto
        const updatedProduct = await productTypes_models_1.default.findByIdAndUpdate(id, { $set: updateObj }, { new: true });
        return handler_helper_1.default.success(res, {
            message: 'Producto actualizado exitosamente',
            data: { product: updatedProduct }
        });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.updateProductType = updateProductType;
const deleteProductType = async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar que el producto existe
        const existingProduct = await productTypes_models_1.default.findById(id);
        if (!existingProduct) {
            return handler_helper_1.default.error(res, {
                code: 404,
                message: 'El producto no existe'
            });
        }
        // Eliminar el producto
        await productTypes_models_1.default.findByIdAndDelete(id);
        return handler_helper_1.default.success(res, {
            message: 'Producto eliminado exitosamente',
            data: { deletedId: id }
        });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.deleteProductType = deleteProductType;
const updateStock = async (req, res) => {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { quantity, operation, reason } = req.body;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        const userRole = ((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) || 'user';
        const stockService = new stock_service_1.StockService();
        const result = await stockService.updateStock({
            productId: id,
            quantity,
            operation,
            reason,
            userId,
            userRole
        });
        if (!result.success) {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'Stock update failed',
                errors: [result.error]
            });
        }
        return handler_helper_1.default.success(res, {
            message: 'Stock updated successfully',
            product: result.product,
            movement: result.movement
        });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.updateStock = updateStock;
const getStockHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit } = req.query;
        const stockService = new stock_service_1.StockService();
        const history = await stockService.getStockHistory(id, limit ? parseInt(limit) : 50);
        return handler_helper_1.default.success(res, {
            message: 'Stock history retrieved successfully',
            history
        });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.getStockHistory = getStockHistory;
const getLowStockProducts = async (req, res) => {
    try {
        const { threshold } = req.query;
        const stockService = new stock_service_1.StockService();
        const products = await stockService.getLowStockProducts(threshold ? parseInt(threshold) : 10);
        return handler_helper_1.default.success(res, {
            message: 'Low stock products retrieved successfully',
            products,
            threshold: threshold ? parseInt(threshold) : 10
        });
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.getLowStockProducts = getLowStockProducts;
//# sourceMappingURL=productType.controller.js.map