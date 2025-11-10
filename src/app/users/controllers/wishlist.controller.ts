import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import wishlistService from '../services/wishlist.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, BAD_REQUEST, NOT_FOUND, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class WishlistController {
  
  /**
   * GET /api/wishlist
   * Obtiene la wishlist del usuario
   */
  public async getWishlist(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const wishlist = await wishlistService.getWishlist(userId);
      
      return HttpHandler.success(res, { wishlist });
      
    } catch (error: any) {
      console.error('Error fetching wishlist:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to fetch wishlist' 
      });
    }
  }
  
  /**
   * POST /api/wishlist/add
   * Agrega un producto a la wishlist
   */
  public async addItem(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { productId, enablePriceAlert, alertThreshold } = req.body;
      
      if (!productId) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Product ID is required' 
        });
      }
      
      const wishlist = await wishlistService.addItem(userId, productId, enablePriceAlert, alertThreshold);
      
      return HttpHandler.success(res, { 
        message: 'Product added to wishlist',
        wishlist 
      });
      
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      return HttpHandler.error(res, { 
        code: error.message === 'Product not found' ? NOT_FOUND : INTERNAL_ERROR, 
        message: error.message || 'Failed to add product to wishlist' 
      });
    }
  }
  
  /**
   * DELETE /api/wishlist/remove/:productId
   * Elimina un producto de la wishlist
   */
  public async removeItem(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;
      
      const wishlist = await wishlistService.removeItem(userId, productId);
      
      return HttpHandler.success(res, { 
        message: 'Product removed from wishlist',
        wishlist 
      });
      
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to remove product from wishlist' 
      });
    }
  }
  
  /**
   * PUT /api/wishlist/price-alert/:productId
   * Actualiza la alerta de precio
   */
  public async updatePriceAlert(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { productId } = req.params;
      const { enabled, threshold } = req.body;
      
      const wishlist = await wishlistService.updatePriceAlert(userId, productId, enabled, threshold);
      
      return HttpHandler.success(res, { 
        message: 'Price alert updated',
        wishlist 
      });
      
    } catch (error: any) {
      console.error('Error updating price alert:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to update price alert' 
      });
    }
  }
  
  /**
   * DELETE /api/wishlist/clear
   * Limpia toda la wishlist
   */
  public async clearWishlist(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const wishlist = await wishlistService.clearWishlist(userId);
      
      return HttpHandler.success(res, { 
        message: 'Wishlist cleared',
        wishlist 
      });
      
    } catch (error: any) {
      console.error('Error clearing wishlist:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to clear wishlist' 
      });
    }
  }
  
  /**
   * POST /api/wishlist/move-to-cart
   * Mueve productos de la wishlist al carrito
   */
  public async moveToCart(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const { productIds } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Product IDs array is required' 
        });
      }
      
      await wishlistService.moveToCart(userId, productIds);
      
      return HttpHandler.success(res, { message: 'Products moved to cart' });
      
    } catch (error: any) {
      console.error('Error moving to cart:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to move products to cart' 
      });
    }
  }
}

export default new WishlistController();
