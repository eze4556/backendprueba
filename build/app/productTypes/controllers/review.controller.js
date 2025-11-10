"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const review_service_1 = __importDefault(require("../services/review.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
class ReviewController {
    /**
     * GET /api/reviews
     * Lista todos los reviews (con paginación)
     */
    async getAllReviews(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const sortBy = req.query.sortBy || 'createdAt';
            const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
            const result = await review_service_1.default.getReviews(undefined, undefined, { rating, sortBy }, limit, skip);
            return handler_helper_1.default.success(res, {
                message: 'Reviews retrieved successfully',
                reviews: result.reviews,
                pagination: {
                    total: result.total,
                    page,
                    limit,
                    pages: Math.ceil(result.total / limit)
                }
            });
        }
        catch (error) {
            console.error('Error getting all reviews:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get reviews'
            });
        }
    }
    /**
     * POST /api/reviews
     * Crea un nuevo review
     */
    async createReview(req, res) {
        try {
            const userId = req.user.id;
            const { productId, professionalId, orderId, rating, title, comment, images } = req.body;
            // Validaciones
            if (!productId && !professionalId) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Must provide either productId or professionalId'
                });
            }
            if (!rating || rating < 1 || rating > 5) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Rating must be between 1 and 5'
                });
            }
            if (!comment || comment.length < 10) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Comment must be at least 10 characters long'
                });
            }
            // Obtener nombre de usuario (en producción, obtener de la BD)
            const userName = 'Usuario'; // TODO: obtener del user
            const review = await review_service_1.default.createReview({
                userId,
                userName,
                productId,
                professionalId,
                orderId,
                rating,
                title,
                comment,
                images
            });
            return handler_helper_1.default.success(res, {
                message: 'Review created successfully',
                review
            }, codes_constanst_1.CREATED);
        }
        catch (error) {
            console.error('Error creating review:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to create review'
            });
        }
    }
    /**
     * GET /api/reviews/product/:productId
     * Obtiene reviews de un producto
     */
    async getProductReviews(req, res) {
        try {
            const { productId } = req.params;
            // Validar que productId sea un ObjectId válido
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return handler_helper_1.default.success(res, {
                    reviews: [],
                    total: 0,
                    page: 1,
                    totalPages: 0,
                    stats: {
                        averageRating: 0,
                        totalReviews: 0,
                        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                    }
                });
            }
            const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
            const verifiedOnly = req.query.verifiedOnly === 'true';
            const sortBy = req.query.sortBy;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const result = await review_service_1.default.getReviews(productId, undefined, { rating, verifiedOnly, sortBy }, limit, skip);
            // Obtener estadísticas
            const stats = await review_service_1.default.getReviewStats(productId);
            return handler_helper_1.default.success(res, {
                reviews: result.reviews,
                total: result.total,
                page,
                totalPages: Math.ceil(result.total / limit),
                stats
            });
        }
        catch (error) {
            console.error('Error fetching product reviews:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to fetch reviews'
            });
        }
    }
    /**
     * GET /api/reviews/professional/:professionalId
     * Obtiene reviews de un profesional
     */
    async getProfessionalReviews(req, res) {
        try {
            const { professionalId } = req.params;
            const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
            const verifiedOnly = req.query.verifiedOnly === 'true';
            const sortBy = req.query.sortBy;
            const limit = parseInt(req.query.limit) || 20;
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * limit;
            const result = await review_service_1.default.getReviews(undefined, professionalId, { rating, verifiedOnly, sortBy }, limit, skip);
            // Obtener estadísticas
            const stats = await review_service_1.default.getReviewStats(undefined, professionalId);
            return handler_helper_1.default.success(res, {
                reviews: result.reviews,
                total: result.total,
                page,
                totalPages: Math.ceil(result.total / limit),
                stats
            });
        }
        catch (error) {
            console.error('Error fetching professional reviews:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to fetch reviews'
            });
        }
    }
    /**
     * POST /api/reviews/:id/like
     * Da like o unlike a un review
     */
    async likeReview(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const review = await review_service_1.default.likeReview(id, userId);
            if (!review) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Review not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Review updated',
                review
            });
        }
        catch (error) {
            console.error('Error liking review:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to like review'
            });
        }
    }
    /**
     * POST /api/reviews/:id/respond
     * Responde a un review (vendedor/profesional)
     */
    async respondToReview(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { response } = req.body;
            if (!response || response.length < 10) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Response must be at least 10 characters long'
                });
            }
            const review = await review_service_1.default.respondToReview(id, userId, response);
            if (!review) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Review not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Response added successfully',
                review
            });
        }
        catch (error) {
            console.error('Error responding to review:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to respond to review'
            });
        }
    }
    /**
     * POST /api/reviews/:id/flag
     * Reporta un review
     */
    async flagReview(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            if (!reason) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Reason is required'
                });
            }
            const review = await review_service_1.default.flagReview(id, reason);
            if (!review) {
                return handler_helper_1.default.error(res, { code: codes_constanst_1.NOT_FOUND, message: 'Review not found' });
            }
            return handler_helper_1.default.success(res, {
                message: 'Review flagged for moderation',
                review
            });
        }
        catch (error) {
            console.error('Error flagging review:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to flag review'
            });
        }
    }
    /**
     * DELETE /api/reviews/:id
     * Elimina un review
     */
    async deleteReview(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const deleted = await review_service_1.default.deleteReview(id, userId);
            if (!deleted) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.NOT_FOUND,
                    message: 'Review not found or unauthorized'
                });
            }
            return handler_helper_1.default.success(res, { message: 'Review deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting review:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to delete review'
            });
        }
    }
}
exports.default = new ReviewController();
//# sourceMappingURL=review.controller.js.map