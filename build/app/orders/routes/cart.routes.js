"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_service_1 = __importDefault(require("../services/cart.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const codes_constanst_1 = require("../../../constants/codes.constanst");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/cart
 * @desc    Obtener carrito del usuario autenticado
 * @access  Private
 */
router.get('/', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // Usar 'id' en lugar de 'userId'
        const cart = await cart_service_1.default.getCart(userId);
        return handler_helper_1.default.success(res, {
            cart
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   POST /api/cart/add
 * @desc    Agregar producto al carrito
 * @access  Private
 */
router.post('/add', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity, productData } = req.body;
        if (!productId || !productData) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'productId y productData son requeridos'
            });
        }
        const cart = await cart_service_1.default.addItem(userId, productId, quantity || 1, productData);
        return handler_helper_1.default.success(res, {
            message: 'Producto agregado al carrito',
            cart
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   PUT /api/cart/update/:productId
 * @desc    Actualizar cantidad de un producto en el carrito
 * @access  Private
 */
router.put('/update/:productId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 0) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'La cantidad debe ser mayor o igual a 0'
            });
        }
        const cart = await cart_service_1.default.updateItemQuantity(userId, productId, quantity);
        return handler_helper_1.default.success(res, {
            message: 'Carrito actualizado',
            cart
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: error instanceof Error && error.message.includes('no encontrado') ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Eliminar producto del carrito
 * @access  Private
 */
router.delete('/remove/:productId', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        const cart = await cart_service_1.default.removeItem(userId, productId);
        return handler_helper_1.default.success(res, {
            message: 'Producto eliminado del carrito',
            cart
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: error instanceof Error && error.message.includes('no encontrado') ? codes_constanst_1.NOT_FOUND : codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   DELETE /api/cart/clear
 * @desc    Limpiar carrito
 * @access  Private
 */
router.delete('/clear', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cart_service_1.default.clearCart(userId);
        return handler_helper_1.default.success(res, {
            message: 'Carrito limpiado',
            cart
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   POST /api/cart/sync
 * @desc    Sincronizar carrito local con servidor
 * @access  Private
 */
router.post('/sync', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'items debe ser un array'
            });
        }
        // Validar cada item del array
        for (const item of items) {
            if (!item.productId) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Cada item debe tener un productId'
                });
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(item.productId)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: `Invalid productId format: ${item.productId}`
                });
            }
            if (!item.quantity || item.quantity < 1) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Cada item debe tener una cantidad válida (>= 1)'
                });
            }
        }
        const cart = await cart_service_1.default.syncCart(userId, items);
        return handler_helper_1.default.success(res, {
            message: 'Carrito sincronizado',
            cart
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   POST /api/cart/validate
 * @desc    Validar stock antes de checkout
 * @access  Private
 */
router.post('/validate', auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        await cart_service_1.default.validateStock(userId);
        return handler_helper_1.default.success(res, {
            message: 'Stock validado correctamente',
            valid: true
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.BAD_REQUEST,
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=cart.routes.js.map