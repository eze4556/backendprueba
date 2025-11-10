"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const mongoose_1 = __importDefault(require("mongoose"));
class BaseController {
    constructor(model) {
        this.model = model;
    }
    // Método GET genérico con paginación y filtros
    async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const filter = this.buildFilter(req.query);
            const sort = this.buildSort(req.query.sort);
            const [items, total] = await Promise.all([
                this.model.find(filter).sort(sort).skip(skip).limit(limit),
                this.model.countDocuments(filter)
            ]);
            return handler_helper_1.default.success(res, {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            return this.handleError(res, error);
        }
    }
    // Método GET por ID genérico
    async getById(req, res) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return handler_helper_1.default.error(res, {
                    code: 404,
                    message: 'Item not found'
                });
            }
            return handler_helper_1.default.success(res, item);
        }
        catch (error) {
            return this.handleError(res, error);
        }
    }
    // Método CREATE genérico
    async create(req, res) {
        try {
            const item = new this.model(req.body);
            await item.save();
            return handler_helper_1.default.success(res, item, 201);
        }
        catch (error) {
            return this.handleError(res, error);
        }
    }
    // Método UPDATE genérico
    async update(req, res) {
        try {
            const item = await this.model.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
            if (!item) {
                return handler_helper_1.default.error(res, {
                    code: 404,
                    message: 'Item not found'
                });
            }
            return handler_helper_1.default.success(res, item);
        }
        catch (error) {
            return this.handleError(res, error);
        }
    }
    // Método DELETE genérico
    async delete(req, res) {
        try {
            const item = await this.model.findByIdAndDelete(req.params.id);
            if (!item) {
                return handler_helper_1.default.error(res, {
                    code: 404,
                    message: 'Item not found'
                });
            }
            return handler_helper_1.default.success(res, { message: 'Item deleted successfully' });
        }
        catch (error) {
            return this.handleError(res, error);
        }
    }
    // Métodos auxiliares
    buildFilter(query) {
        const filter = {};
        // Eliminar parámetros de paginación y ordenamiento
        delete query.page;
        delete query.limit;
        delete query.sort;
        // Construir filtro basado en los parámetros restantes
        Object.keys(query).forEach(key => {
            if (query[key]) {
                if (mongoose_1.default.Types.ObjectId.isValid(query[key])) {
                    filter[key] = query[key];
                }
                else if (typeof query[key] === 'string') {
                    filter[key] = new RegExp(query[key], 'i');
                }
                else {
                    filter[key] = query[key];
                }
            }
        });
        return filter;
    }
    buildSort(sortParam) {
        if (!sortParam)
            return { createdAt: -1 };
        const sort = {};
        const fields = sortParam.split(',');
        fields.forEach(field => {
            if (field.startsWith('-')) {
                sort[field.substring(1)] = -1;
            }
            else {
                sort[field] = 1;
            }
        });
        return sort;
    }
    handleError(res, error) {
        console.error('Error in controller:', error);
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'Validation Error',
                errors: Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        if (error instanceof mongoose_1.default.Error.CastError) {
            return handler_helper_1.default.error(res, {
                code: 400,
                message: 'Invalid ID format'
            });
        }
        if (error.code === 11000) { // Duplicate key error
            return handler_helper_1.default.error(res, {
                code: 409,
                message: 'Duplicate entry'
            });
        }
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Internal Server Error'
        });
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=base.controller.js.map