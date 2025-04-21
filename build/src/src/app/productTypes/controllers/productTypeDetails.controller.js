"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductTypeDetails = void 0;
const productTypes_models_1 = __importDefault(require("../models/productTypes.models"));
const getProductTypeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const productType = await productTypes_models_1.default.findById(id);
        if (!productType) {
            return res.status(404).json({ message: 'Product type not found' });
        }
        res.json(productType);
    }
    catch (error) {
        const errorMessage = error.message;
        res.status(500).json({ message: 'Internal server error', error: errorMessage });
    }
};
exports.getProductTypeDetails = getProductTypeDetails;
