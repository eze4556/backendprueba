import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/reviews
 * Lista todos los reviews (con paginación)
 * Query params: page?, limit?, sortBy?, rating?
 * Público
 */
// @ts-ignore
router.get('/', (req, res) => 
  reviewController.getAllReviews(req as any, res)
);

/**
 * POST /api/reviews
 * Crea un nuevo review
 * Body: { productId?, professionalId?, rating, title?, comment, images? }
 * Requiere autenticación
 */
// @ts-ignore
router.post('/', authMiddleware, (req, res) => 
  reviewController.createReview(req as any, res)
);

/**
 * GET /api/reviews/product/:productId
 * Obtiene reviews de un producto
 * Query params: rating?, verifiedOnly?, sortBy?, limit?, page?
 * Público
 */
router.get('/product/:productId', (req, res) => 
  reviewController.getProductReviews(req as any, res)
);

/**
 * GET /api/reviews/professional/:professionalId
 * Obtiene reviews de un profesional
 * Query params: rating?, verifiedOnly?, sortBy?, limit?, page?
 * Público
 */
router.get('/professional/:professionalId', (req, res) => 
  reviewController.getProfessionalReviews(req as any, res)
);

/**
 * POST /api/reviews/:id/like
 * Da like o unlike a un review
 * Requiere autenticación
 */
// @ts-ignore
router.post('/:id/like', authMiddleware, (req, res) => 
  reviewController.likeReview(req as any, res)
);

/**
 * POST /api/reviews/:id/respond
 * Responde a un review (vendedor/profesional)
 * Body: { response: string }
 * Requiere autenticación
 */
// @ts-ignore
router.post('/:id/respond', authMiddleware, (req, res) => 
  reviewController.respondToReview(req as any, res)
);

/**
 * POST /api/reviews/:id/flag
 * Reporta un review
 * Body: { reason: string }
 * Requiere autenticación
 */
// @ts-ignore
router.post('/:id/flag', authMiddleware, (req, res) => 
  reviewController.flagReview(req as any, res)
);

/**
 * DELETE /api/reviews/:id
 * Elimina un review
 * Requiere autenticación (solo el autor)
 */
// @ts-ignore
router.delete('/:id', authMiddleware, (req, res) => 
  reviewController.deleteReview(req as any, res)
);

export default router;
