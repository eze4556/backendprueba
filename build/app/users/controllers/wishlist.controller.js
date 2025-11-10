"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wishlist_service_1 = __importDefault(require("../services/wishlist.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class WishlistController {
    /**
     * GET /api/wishlist
     * Obtiene la wishlist del usuario
     */
    async getWishlist(req, res) {
        try {
            const userId = req.user.id;
            const wishlist = await wishlist_service_1.default.getWishlist(userId);
            return handler_helper_1.default.success(res, { wishlist });
        }
        catch (error) {
            console.error('Error fetching wishlist:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to fetch wishlist'
            });
        }
    }
    /**
     * POST /api/wishlist/add
     * Agrega un producto a la wishlist
     */
    async addItem(req, res) {
        try {
            const userId = req.user.id;
            const { productId, enablePriceAlert, alertThreshold } = req.body;
            if (!productId) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Product ID is required'
                });
            }
            const wishlist = await wishlist_service_1.default.addItem(userId, productId, enablePriceAlert, alertThreshold);
            return handler_helper_1.default.success(res, {
                message: 'Product added to wishlist',
                wishlist
            });
        }
        catch (error) {
            console.error('Error adding to wishlist:', error);
            return handler_helper_1.default.error(res, {
                code: error.message === 'Product not found' ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to add product to wishlist'
            });
        }
    }
    /**
     * DELETE /api/wishlist/remove/:productId
     * Elimina un producto de la wishlist
     */
    async removeItem(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const wishlist = await wishlist_service_1.default.removeItem(userId, productId);
            return handler_helper_1.default.success(res, {
                message: 'Product removed from wishlist',
                wishlist
            });
        }
        catch (error) {
            console.error('Error removing from wishlist:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to remove product from wishlist'
            });
        }
    }
    /**
     * PUT /api/wishlist/price-alert/:productId
     * Actualiza la alerta de precio
     */
    async updatePriceAlert(req, res) {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const { enabled, threshold } = req.body;
            const wishlist = await wishlist_service_1.default.updatePriceAlert(userId, productId, enabled, threshold);
            return handler_helper_1.default.success(res, {
                message: 'Price alert updated',
                wishlist
            });
        }
        catch (error) {
            console.error('Error updating price alert:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to update price alert'
            });
        }
    }
    /**
     * DELETE /api/wishlist/clear
     * Limpia toda la wishlist
     */
    async clearWishlist(req, res) {
        try {
            const userId = req.user.id;
            const wishlist = await wishlist_service_1.default.clearWishlist(userId);
            return handler_helper_1.default.success(res, {
                message: 'Wishlist cleared',
                wishlist
            });
        }
        catch (error) {
            console.error('Error clearing wishlist:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to clear wishlist'
            });
        }
    }
    /**
     * POST /api/wishlist/move-to-cart
     * Mueve productos de la wishlist al carrito
     */
    async moveToCart(req, res) {
        try {
            const userId = req.user.id;
            const { productIds } = req.body;
            if (!Array.isArray(productIds) || productIds.length === 0) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Product IDs array is required'
                });
            }
            await wishlist_service_1.default.moveToCart(userId, productIds);
            return handler_helper_1.default.success(res, { message: 'Products moved to cart' });
        }
        catch (error) {
            console.error('Error moving to cart:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to move products to cart'
            });
        }
    }
}
exports.default = new WishlistController();
//# sourceMappingURL=wishlist.controller.js.map