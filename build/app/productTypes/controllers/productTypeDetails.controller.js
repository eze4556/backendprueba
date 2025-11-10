"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductTypeDetails = void 0;
const productTypes_models_1 = __importDefault(require("../models/productTypes.models"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const getProductTypeDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const productType = await productTypes_models_1.default.findById(id);
        if (!productType) {
            return res.status(404).json({ message: 'Product type not found' });
        }
        return handler_helper_1.default.success(res, productType);
    }
    catch (error) {
        const errorMessage = error.message;
        return handler_helper_1.default.error(res, {
            code: 500,
            message: 'Internal server error',
            errors: [errorMessage]
        });
    }
};
exports.getProductTypeDetails = getProductTypeDetails;
//# sourceMappingURL=productTypeDetails.controller.js.map