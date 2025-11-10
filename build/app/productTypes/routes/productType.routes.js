"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const productType_controller_1 = require("../controllers/productType.controller");
const productTypeDetails_controller_1 = require("../../productTypes/controllers/productTypeDetails.controller");
const publicProducts_controller_1 = require("../controllers/publicProducts.controller");
const product_roles_middleware_1 = require("../../../middleware/product-roles.middleware");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const product_validation_middleware_1 = require("../../../middleware/product-validation.middleware");
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const router = (0, express_1.Router)();
// ===== RUTAS PÚBLICAS (sin autenticación) =====
// Obtener productos de un vendedor específico - PÚBLICO
router.get('/public/seller/:sellerId/:sellerType', publicProducts_controller_1.getPublicProductsBySeller);
// ===== RUTAS DE SOLO LECTURA (todos los usuarios autenticados) =====
router.get('/', auth_middleware_1.authMiddleware, product_roles_middleware_1.canReadProducts, productType_controller_1.getProductTypes);
router.post('/get_details', product_roles_middleware_1.canReadProducts, product_validation_middleware_1.validateProductExists, productTypeDetails_controller_1.getProductTypeDetails);
router.post('/get_all', product_roles_middleware_1.canReadProducts, productType_controller_1.getAllProductTypes);
router.post('/search', product_roles_middleware_1.canReadProducts, productType_controller_1.search);
// ===== RUTAS DE MODIFICACIÓN (admin, professional, provider) =====
router.post('/', product_roles_middleware_1.canModifyProducts, product_validation_middleware_1.validateProductData, upload.single('image'), productType_controller_1.createProductType);
router.post('/product-types', product_roles_middleware_1.canModifyProducts, product_validation_middleware_1.validateProductData, upload.single('image'), productType_controller_1.createProductType);
router.put('/:id', product_roles_middleware_1.canModifyProducts, product_validation_middleware_1.validateProductExists, product_validation_middleware_1.validateProductData, productType_controller_1.updateProductType);
router.delete('/:id', product_roles_middleware_1.canModifyProducts, product_validation_middleware_1.validateProductExists, product_validation_middleware_1.validateProductOwnership, productType_controller_1.deleteProductType);
router.post('/change_access', product_roles_middleware_1.canModifyProducts, product_validation_middleware_1.validateProductExists, productType_controller_1.changeAccess);
router.post('/associate', product_roles_middleware_1.canModifyProducts, productType_controller_1.associateProductType);
// ===== RUTAS DE GESTIÓN DE STOCK (admin, professional, provider) =====
router.put('/:id/stock', product_roles_middleware_1.canModifyProducts, product_validation_middleware_1.validateProductExists, product_validation_middleware_1.validateStockOperation, product_validation_middleware_1.validateMinimumStock, productType_controller_1.updateStock);
router.get('/:id/stock/history', product_roles_middleware_1.canReadProducts, product_validation_middleware_1.validateProductExists, productType_controller_1.getStockHistory);
router.get('/stock/low', product_roles_middleware_1.canReadProducts, productType_controller_1.getLowStockProducts);
// ===== RUTAS ADMINISTRATIVAS (solo admin) =====
// Aquí se pueden agregar rutas que solo los admins pueden usar
// router.post('/bulk-update', adminOnly, bulkUpdateProducts);
// router.delete('/bulk-delete', adminOnly, bulkDeleteProducts);
exports.default = router;
//# sourceMappingURL=productType.routes.js.map