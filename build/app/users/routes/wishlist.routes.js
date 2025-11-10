"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wishlist_controller_1 = __importDefault(require("../controllers/wishlist.controller"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/wishlist
 * Obtener wishlist del usuario autenticado
 */
// @ts-ignore
router.get('/', auth_middleware_1.authMiddleware, (req, res) => {
    wishlist_controller_1.default.getWishlist(req, res);
});
/**
 * POST /api/wishlist/add
 * Agregar producto a la wishlist
 * Body: { productId, enablePriceAlert?, alertThreshold? }
 */
// @ts-ignore
router.post('/add', auth_middleware_1.authMiddleware, (req, res) => {
    wishlist_controller_1.default.addItem(req, res);
});
/**
 * DELETE /api/wishlist/remove/:productId
 * Eliminar producto de la wishlist
 */
// @ts-ignore
router.delete('/remove/:productId', auth_middleware_1.authMiddleware, (req, res) => {
    wishlist_controller_1.default.removeItem(req, res);
});
/**
 * PUT /api/wishlist/price-alert/:productId
 * Actualizar alerta de precio
 * Body: { enabled, threshold? }
 */
// @ts-ignore
router.put('/price-alert/:productId', auth_middleware_1.authMiddleware, (req, res) => {
    wishlist_controller_1.default.updatePriceAlert(req, res);
});
/**
 * DELETE /api/wishlist/clear
 * Limpiar toda la wishlist
 */
// @ts-ignore
router.delete('/clear', auth_middleware_1.authMiddleware, (req, res) => {
    wishlist_controller_1.default.clearWishlist(req, res);
});
/**
 * POST /api/wishlist/move-to-cart
 * Mover productos de wishlist a carrito
 * Body: { productIds: string[] }
 */
// @ts-ignore
router.post('/move-to-cart', auth_middleware_1.authMiddleware, (req, res) => {
    wishlist_controller_1.default.moveToCart(req, res);
});
exports.default = router;
//# sourceMappingURL=wishlist.routes.js.map