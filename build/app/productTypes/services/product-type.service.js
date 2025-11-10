"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductTypeService = void 0;
const product_type_model_1 = require("../models/product-type.model");
class ProductTypeService {
    async getById(id) {
        const product = await product_type_model_1.ProductType.findById(id);
        if (!product) {
            throw new Error('Product type not found');
        }
        return product;
    }
    async create(data) {
        const product = new product_type_model_1.ProductType(data);
        return await product.save();
    }
    async update(id, data) {
        return await product_type_model_1.ProductType.findByIdAndUpdate(id, data, { new: true });
    }
    async delete(id) {
        const result = await product_type_model_1.ProductType.findByIdAndDelete(id);
        return result !== null;
    }
    async getAll() {
        return await product_type_model_1.ProductType.find();
    }
    async getActive() {
        return await product_type_model_1.ProductType.find({ active: true });
    }
}
exports.ProductTypeService = ProductTypeService;
//# sourceMappingURL=product-type.service.js.map