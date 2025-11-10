"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const review_models_1 = __importDefault(require("../models/review.models"));
const order_models_1 = __importDefault(require("../../orders/models/order.models"));
const productTypes_models_1 = __importDefault(require("../models/productTypes.models"));
const professional_models_1 = __importDefault(require("../../professional/models/professional.models"));
const mongoose_1 = __importDefault(require("mongoose"));
const notification_service_1 = __importDefault(require("../../users/services/notification.service"));
class ReviewService {
    /**
     * Verifica si el usuario compró el producto
     */
    async verifyPurchase(userId, productId) {
        const order = await order_models_1.default.findOne({
            userId,
            'items.productId': productId,
            status: 'delivered' // Solo órdenes entregadas
        });
        return {
            verified: !!order,
            orderId: (order === null || order === void 0 ? void 0 : order._id) ? order._id.toString() : undefined
        };
    }
    /**
     * Crea un nuevo review
     */
    async createReview(data) {
        let verifiedPurchase = false;
        let orderId = data.orderId;
        // Verificar compra si es un review de producto
        if (data.productId) {
            const verification = await this.verifyPurchase(data.userId, data.productId);
            verifiedPurchase = verification.verified;
            if (!orderId && verification.orderId) {
                orderId = verification.orderId;
            }
        }
        // Crear review
        const review = new review_models_1.default({
            userId: data.userId,
            userName: data.userName,
            userImage: data.userImage,
            productId: data.productId,
            professionalId: data.professionalId,
            orderId,
            rating: data.rating,
            title: data.title,
            comment: data.comment,
            images: data.images || [],
            verifiedPurchase
        });
        await review.save();
        // Actualizar promedio de calificación
        if (data.productId) {
            await this.updateProductRating(data.productId);
        }
        else if (data.professionalId) {
            await this.updateProfessionalRating(data.professionalId);
        }
        // Notificar al dueño del producto/profesional
        // TODO: obtener ID del dueño y enviar notificación
        return review;
    }
    /**
     * Actualiza el promedio de calificación de un producto
     */
    async updateProductRating(productId) {
        const stats = await this.getReviewStats(productId);
        await productTypes_models_1.default.findByIdAndUpdate(productId, {
            'product_info.rating': stats.averageRating,
            'product_info.reviewCount': stats.totalReviews
        });
    }
    /**
     * Actualiza el promedio de calificación de un profesional
     */
    async updateProfessionalRating(professionalId) {
        const stats = await this.getReviewStats(undefined, professionalId);
        await professional_models_1.default.findByIdAndUpdate(professionalId, {
            rating: stats.averageRating,
            reviewCount: stats.totalReviews
        });
    }
    /**
     * Obtiene estadísticas de reviews
     */
    async getReviewStats(productId, professionalId) {
        const query = { status: 'approved' };
        if (productId) {
            query.productId = productId;
        }
        else if (professionalId) {
            query.professionalId = professionalId;
        }
        const reviews = await review_models_1.default.find(query);
        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
        return {
            averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
            totalReviews,
            ratingDistribution
        };
    }
    /**
     * Obtiene reviews de un producto o profesional
     */
    async getReviews(productId, professionalId, filters, limit = 20, skip = 0) {
        const query = { status: 'approved' };
        if (productId) {
            query.productId = productId;
        }
        else if (professionalId) {
            query.professionalId = professionalId;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.rating) {
            query.rating = filters.rating;
        }
        if (filters === null || filters === void 0 ? void 0 : filters.verifiedOnly) {
            query.verifiedPurchase = true;
        }
        // Ordenamiento
        let sort = { createdAt: -1 }; // Default: más recientes
        if ((filters === null || filters === void 0 ? void 0 : filters.sortBy) === 'helpful') {
            sort = { likes: -1 };
        }
        else if ((filters === null || filters === void 0 ? void 0 : filters.sortBy) === 'rating_high') {
            sort = { rating: -1 };
        }
        else if ((filters === null || filters === void 0 ? void 0 : filters.sortBy) === 'rating_low') {
            sort = { rating: 1 };
        }
        const [reviews, total] = await Promise.all([
            review_models_1.default.find(query)
                .sort(sort)
                .limit(limit)
                .skip(skip),
            review_models_1.default.countDocuments(query)
        ]);
        return { reviews, total };
    }
    /**
     * Obtiene un review por ID
     */
    async getReviewById(reviewId) {
        return await review_models_1.default.findById(reviewId);
    }
    /**
     * Agrega un like a un review
     */
    async likeReview(reviewId, userId) {
        const review = await review_models_1.default.findById(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }
        const userIdObj = new mongoose_1.default.Types.ObjectId(userId);
        const alreadyLiked = review.likedBy.some(id => id.toString() === userId);
        if (alreadyLiked) {
            // Unlike
            review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
            review.likes = Math.max(0, review.likes - 1);
        }
        else {
            // Like
            review.likedBy.push(userIdObj);
            review.likes += 1;
        }
        await review.save();
        return review;
    }
    /**
     * Responde a un review (vendedor/profesional)
     */
    async respondToReview(reviewId, responderId, responseText) {
        const review = await review_models_1.default.findById(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }
        // TODO: Verificar que el responderId sea el dueño del producto/profesional
        review.response = {
            text: responseText,
            respondedAt: new Date(),
            respondedBy: new mongoose_1.default.Types.ObjectId(responderId)
        };
        await review.save();
        // Notificar al autor del review
        await notification_service_1.default.createNotification({
            userId: review.userId.toString(),
            type: 'new_message', // O crear un tipo específico
            title: 'Respuesta a tu reseña',
            message: `El vendedor ha respondido a tu reseña`,
            actionUrl: `/reviews/${reviewId}`
        });
        return review;
    }
    /**
     * Reporta un review
     */
    async flagReview(reviewId, reason) {
        const review = await review_models_1.default.findByIdAndUpdate(reviewId, {
            status: 'flagged',
            flagReason: reason
        }, { new: true });
        return review;
    }
    /**
     * Elimina un review (solo el autor o admin)
     */
    async deleteReview(reviewId, userId) {
        const review = await review_models_1.default.findOne({ _id: reviewId, userId });
        if (!review) {
            return false;
        }
        await review.deleteOne();
        // Actualizar promedio de calificación
        if (review.productId) {
            await this.updateProductRating(review.productId.toString());
        }
        else if (review.professionalId) {
            await this.updateProfessionalRating(review.professionalId.toString());
        }
        return true;
    }
}
exports.default = new ReviewService();
//# sourceMappingURL=review.service.js.map