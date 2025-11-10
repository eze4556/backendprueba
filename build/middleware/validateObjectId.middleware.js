"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = exports.validateMultipleObjectIds = exports.validateObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Middleware para validar que un parámetro sea un ObjectId válido de MongoDB
 * @param paramName - Nombre del parámetro a validar (por defecto 'id')
 */
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!id) {
            return res.status(400).json({
                success: false,
                error: `Parameter '${paramName}' is required`
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId`
            });
        }
        next();
    };
};
exports.validateObjectId = validateObjectId;
/**
 * Middleware para validar múltiples parámetros como ObjectIds
 * @param paramNames - Array de nombres de parámetros a validar
 */
const validateMultipleObjectIds = (...paramNames) => {
    return (req, res, next) => {
        for (const paramName of paramNames) {
            const id = req.params[paramName];
            if (id && !mongoose_1.default.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid ${paramName} format. Must be a valid MongoDB ObjectId`
                });
            }
        }
        next();
    };
};
exports.validateMultipleObjectIds = validateMultipleObjectIds;
/**
 * Función helper para validar ObjectId
 * @param id - ID a validar
 * @returns boolean
 */
const isValidObjectId = (id) => {
    return mongoose_1.default.Types.ObjectId.isValid(id);
};
exports.isValidObjectId = isValidObjectId;
//# sourceMappingURL=validateObjectId.middleware.js.map