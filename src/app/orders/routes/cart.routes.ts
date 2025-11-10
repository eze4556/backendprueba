import { Router, Request, Response } from 'express';
import cartService from '../services/cart.service';
import HttpHandler from '../../../helpers/handler.helper';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { AuthRequest } from '../../../interfaces/auth.interface';
import { SUCCESS, BAD_REQUEST, INTERNAL_ERROR, NOT_FOUND } from '../../../constants/codes.constanst';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/cart
 * @desc    Obtener carrito del usuario autenticado
 * @access  Private
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id; // Usar 'id' en lugar de 'userId'
    const cart = await cartService.getCart(userId);
    
    return HttpHandler.success(res, {
      cart
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/cart/add
 * @desc    Agregar producto al carrito
 * @access  Private
 */
router.post('/add', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId, quantity, productData } = req.body;

    if (!productId || !productData) {
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'productId y productData son requeridos'
      });
    }

    const cart = await cartService.addItem(userId, productId, quantity || 1, productData);
    
    return HttpHandler.success(res, {
      message: 'Producto agregado al carrito',
      cart
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   PUT /api/cart/update/:productId
 * @desc    Actualizar cantidad de un producto en el carrito
 * @access  Private
 */
router.put('/update/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'La cantidad debe ser mayor o igual a 0'
      });
    }

    const cart = await cartService.updateItemQuantity(userId, productId, quantity);
    
    return HttpHandler.success(res, {
      message: 'Carrito actualizado',
      cart
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: error instanceof Error && error.message.includes('no encontrado') ? NOT_FOUND : INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   DELETE /api/cart/remove/:productId
 * @desc    Eliminar producto del carrito
 * @access  Private
 */
router.delete('/remove/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { productId } = req.params;

    const cart = await cartService.removeItem(userId, productId);
    
    return HttpHandler.success(res, {
      message: 'Producto eliminado del carrito',
      cart
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: error instanceof Error && error.message.includes('no encontrado') ? NOT_FOUND : INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   DELETE /api/cart/clear
 * @desc    Limpiar carrito
 * @access  Private
 */
router.delete('/clear', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cart = await cartService.clearCart(userId);
    
    return HttpHandler.success(res, {
      message: 'Carrito limpiado',
      cart
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/cart/sync
 * @desc    Sincronizar carrito local con servidor
 * @access  Private
 */
router.post('/sync', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return HttpHandler.error(res, {
        code: BAD_REQUEST,
        message: 'items debe ser un array'
      });
    }

    // Validar cada item del array
    for (const item of items) {
      if (!item.productId) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Cada item debe tener un productId'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: `Invalid productId format: ${item.productId}`
        });
      }

      if (!item.quantity || item.quantity < 1) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Cada item debe tener una cantidad válida (>= 1)'
        });
      }
    }

    const cart = await cartService.syncCart(userId, items);
    
    return HttpHandler.success(res, {
      message: 'Carrito sincronizado',
      cart
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: INTERNAL_ERROR,
      message: (error as Error).message
    });
  }
});

/**
 * @route   POST /api/cart/validate
 * @desc    Validar stock antes de checkout
 * @access  Private
 */
router.post('/validate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await cartService.validateStock(userId);
    
    return HttpHandler.success(res, {
      message: 'Stock validado correctamente',
      valid: true
    });
  } catch (error) {
    return HttpHandler.error(res, {
      code: BAD_REQUEST,
      message: (error as Error).message
    });
  }
});

export default router;
