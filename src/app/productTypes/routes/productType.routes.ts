import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getProductTypes, createProductType, associateProductType, search, changeAccess } from '../controllers/productType.controller';
import { getProductTypeDetails } from '../../productTypes/controllers/productTypeDetails.controller';
import HistoryMiddleware from '../../history/middlewares/history.middlewares';
import { verifyToken, checkActive } from '../../users/middlewares/user.middlewares'; // Import individual middlewares
import Token from '../../../auth/token/token';

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.get('/', getProductTypes);
router.post('/', createProductType);
router.post('/product-types', Token.verifyToken, checkActive, upload.single('image'), createProductType); // Usa multer para manejar la subida de imágenes

router.post('/get_details', Token.verifyToken, checkActive, getProductTypeDetails); // Get details of a single product
router.post('/get_all', Token.verifyToken, checkActive, getProductTypes); // Get all products
router.post('/change_access', Token.verifyToken, checkActive, changeAccess); // Change product access
router.post('/search', Token.verifyToken, checkActive, search); // Search products
router.post('/associate', Token.verifyToken, checkActive, associateProductType); // Associate to a product

export default router;