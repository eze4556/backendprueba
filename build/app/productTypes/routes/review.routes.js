"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * GET /api/reviews
 * Lista todos los reviews (con paginación)
 * Query params: page?, limit?, sortBy?, rating?
 * Público
 */
// @ts-ignore
router.get('/', (req, res) => review_controller_1.default.getAllReviews(req, res));
/**
 * POST /api/reviews
 * Crea un nuevo review
 * Body: { productId?, professionalId?, rating, title?, comment, images? }
 * Requiere autenticación
 */
// @ts-ignore
router.post('/', auth_middleware_1.authMiddleware, (req, res) => review_controller_1.default.createReview(req, res));
/**
 * GET /api/reviews/product/:productId
 * Obtiene reviews de un producto
 * Query params: rating?, verifiedOnly?, sortBy?, limit?, page?
 * Público
 */
router.get('/product/:productId', (req, res) => review_controller_1.default.getProductReviews(req, res));
/**
 * GET /api/reviews/professional/:professionalId
 * Obtiene reviews de un profesional
 * Query params: rating?, verifiedOnly?, sortBy?, limit?, page?
 * Público
 */
router.get('/professional/:professionalId', (req, res) => review_controller_1.default.getProfessionalReviews(req, res));
/**
 * POST /api/reviews/:id/like
 * Da like o unlike a un review
 * Requiere autenticación
 */
// @ts-ignore
router.post('/:id/like', auth_middleware_1.authMiddleware, (req, res) => review_controller_1.default.likeReview(req, res));
/**
 * POST /api/reviews/:id/respond
 * Responde a un review (vendedor/profesional)
 * Body: { response: string }
 * Requiere autenticación
 */
// @ts-ignore
router.post('/:id/respond', auth_middleware_1.authMiddleware, (req, res) => review_controller_1.default.respondToReview(req, res));
/**
 * POST /api/reviews/:id/flag
 * Reporta un review
 * Body: { reason: string }
 * Requiere autenticación
 */
// @ts-ignore
router.post('/:id/flag', auth_middleware_1.authMiddleware, (req, res) => review_controller_1.default.flagReview(req, res));
/**
 * DELETE /api/reviews/:id
 * Elimina un review
 * Requiere autenticación (solo el autor)
 */
// @ts-ignore
router.delete('/:id', auth_middleware_1.authMiddleware, (req, res) => review_controller_1.default.deleteReview(req, res));
exports.default = router;
//# sourceMappingURL=review.routes.js.map