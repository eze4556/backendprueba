import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import {
  getProductTypes,
  createProductType,
  associateProductType,
  search,
  changeAccess,
  getAllProductTypes,
  updateProductType,
  deleteProductType,
  updateStock,
  getStockHistory,
  getLowStockProducts
} from '../controllers/productType.controller';
import { getProductTypeDetails } from '../../productTypes/controllers/productTypeDetails.controller';
import { getPublicProductsBySeller } from '../controllers/publicProducts.controller';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';
import { verifyToken, checkActive } from '../../users/middlewares/user.middlewares';
import { canModifyProducts, canReadProducts, adminOnly } from '../../../middleware/product-roles.middleware';
import { authMiddleware } from '../../../middleware/auth.middleware';
import {
  validateProductData,
  validateStockOperation,
  validateProductExists,
  validateProductOwnership,
  validateMinimumStock
} from '../../../middleware/product-validation.middleware';
import Token from '../../../auth/token/token';
import { AuthRequest } from '../../../interfaces/auth.interface';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// ===== RUTAS PÚBLICAS (sin autenticación) =====
// Obtener productos de un vendedor específico - PÚBLICO
router.get('/public/seller/:sellerId/:sellerType', getPublicProductsBySeller);

// ===== RUTAS DE SOLO LECTURA (todos los usuarios autenticados) =====
router.get('/', authMiddleware as any, canReadProducts as any, getProductTypes);
router.post('/get_details', canReadProducts as any, validateProductExists as any, getProductTypeDetails);
router.post('/get_all', canReadProducts as any, getAllProductTypes);
router.post('/search', canReadProducts as any, search);

// ===== RUTAS DE MODIFICACIÓN (admin, professional, provider) =====
router.post('/', canModifyProducts as any, validateProductData as any, upload.single('image'), createProductType);
router.post('/product-types', canModifyProducts as any, validateProductData as any, upload.single('image'), createProductType);
router.put('/:id', canModifyProducts as any, validateProductExists as any, validateProductData as any, updateProductType);
router.delete('/:id', canModifyProducts as any, validateProductExists as any, validateProductOwnership as any, deleteProductType);
router.post('/change_access', canModifyProducts as any, validateProductExists as any, changeAccess);
router.post('/associate', canModifyProducts as any, associateProductType);

// ===== RUTAS DE GESTIÓN DE STOCK (admin, professional, provider) =====
router.put('/:id/stock', canModifyProducts as any, validateProductExists as any, validateStockOperation as any, validateMinimumStock as any, updateStock);     
router.get('/:id/stock/history', canReadProducts as any, validateProductExists as any, getStockHistory);
router.get('/stock/low', canReadProducts as any, getLowStockProducts);

// ===== RUTAS ADMINISTRATIVAS (solo admin) =====
// Aquí se pueden agregar rutas que solo los admins pueden usar
// router.post('/bulk-update', adminOnly, bulkUpdateProducts);
// router.delete('/bulk-delete', adminOnly, bulkDeleteProducts);

export default router;
