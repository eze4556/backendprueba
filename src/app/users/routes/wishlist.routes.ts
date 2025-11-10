import { Router } from 'express';
import wishlistController from '../controllers/wishlist.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/wishlist
 * Obtener wishlist del usuario autenticado
 */
// @ts-ignore
router.get('/', authMiddleware, (req, res) => {
  wishlistController.getWishlist(req as any, res);
});

/**
 * POST /api/wishlist/add
 * Agregar producto a la wishlist
 * Body: { productId, enablePriceAlert?, alertThreshold? }
 */
// @ts-ignore
router.post('/add', authMiddleware, (req, res) => {
  wishlistController.addItem(req as any, res);
});

/**
 * DELETE /api/wishlist/remove/:productId
 * Eliminar producto de la wishlist
 */
// @ts-ignore
router.delete('/remove/:productId', authMiddleware, (req, res) => {
  wishlistController.removeItem(req as any, res);
});

/**
 * PUT /api/wishlist/price-alert/:productId
 * Actualizar alerta de precio
 * Body: { enabled, threshold? }
 */
// @ts-ignore
router.put('/price-alert/:productId', authMiddleware, (req, res) => {
  wishlistController.updatePriceAlert(req as any, res);
});

/**
 * DELETE /api/wishlist/clear
 * Limpiar toda la wishlist
 */
// @ts-ignore
router.delete('/clear', authMiddleware, (req, res) => {
  wishlistController.clearWishlist(req as any, res);
});

/**
 * POST /api/wishlist/move-to-cart
 * Mover productos de wishlist a carrito
 * Body: { productIds: string[] }
 */
// @ts-ignore
router.post('/move-to-cart', authMiddleware, (req, res) => {
  wishlistController.moveToCart(req as any, res);
});

export default router;
