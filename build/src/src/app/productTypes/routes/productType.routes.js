"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const productType_controller_1 = require("../controllers/productType.controller");
const productTypeDetails_controller_1 = require("../../productTypes/controllers/productTypeDetails.controller");
const user_middlewares_1 = require("../../users/middlewares/user.middlewares"); // Import individual middlewares
const token_1 = __importDefault(require("../../../auth/token/token"));
const upload = (0, multer_1.default)({ dest: 'uploads/' });
const router = (0, express_1.Router)();
router.get('/', productType_controller_1.getProductTypes);
router.post('/', productType_controller_1.createProductType);
router.post('/product-types', token_1.default.verifyToken, user_middlewares_1.checkActive, upload.single('image'), productType_controller_1.createProductType); // Usa multer para manejar la subida de imágenes
router.post('/get_details', token_1.default.verifyToken, user_middlewares_1.checkActive, productTypeDetails_controller_1.getProductTypeDetails); // Get details of a single product
router.post('/get_all', token_1.default.verifyToken, user_middlewares_1.checkActive, productType_controller_1.getProductTypes); // Get all products
router.post('/change_access', token_1.default.verifyToken, user_middlewares_1.checkActive, productType_controller_1.changeAccess); // Change product access
router.post('/search', token_1.default.verifyToken, user_middlewares_1.checkActive, productType_controller_1.search); // Search products
router.post('/associate', token_1.default.verifyToken, user_middlewares_1.checkActive, productType_controller_1.associateProductType); // Associate to a product
exports.default = router;
