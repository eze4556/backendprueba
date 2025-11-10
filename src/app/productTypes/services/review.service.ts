import Review, { ReviewInterface } from '../models/review.models';
import Order from '../../orders/models/order.models';
import Product from '../models/productTypes.models';
import Professional from '../../professional/models/professional.models';
import mongoose from 'mongoose';
import notificationService from '../../users/services/notification.service';

export interface CreateReviewData {
  userId: string;
  userName: string;
  userImage?: string;
  productId?: string;
  professionalId?: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

class ReviewService {
  
  /**
   * Verifica si el usuario compró el producto
   */
  private async verifyPurchase(userId: string, productId: string): Promise<{ verified: boolean; orderId?: string }> {
    const order = await Order.findOne({
      userId,
      'items.productId': productId,
      status: 'delivered' // Solo órdenes entregadas
    });
    
    return {
      verified: !!order,
      orderId: order?._id ? order._id.toString() : undefined
    };
  }
  
  /**
   * Crea un nuevo review
   */
  public async createReview(data: CreateReviewData): Promise<ReviewInterface> {
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
    const review = new Review({
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
    } else if (data.professionalId) {
      await this.updateProfessionalRating(data.professionalId);
    }
    
    // Notificar al dueño del producto/profesional
    // TODO: obtener ID del dueño y enviar notificación
    
    return review;
  }
  
  /**
   * Actualiza el promedio de calificación de un producto
   */
  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.getReviewStats(productId);
    
    await Product.findByIdAndUpdate(productId, {
      'product_info.rating': stats.averageRating,
      'product_info.reviewCount': stats.totalReviews
    });
  }
  
  /**
   * Actualiza el promedio de calificación de un profesional
   */
  private async updateProfessionalRating(professionalId: string): Promise<void> {
    const stats = await this.getReviewStats(undefined, professionalId);
    
    await Professional.findByIdAndUpdate(professionalId, {
      rating: stats.averageRating,
      reviewCount: stats.totalReviews
    });
  }
  
  /**
   * Obtiene estadísticas de reviews
   */
  public async getReviewStats(productId?: string, professionalId?: string): Promise<ReviewStats> {
    const query: any = { status: 'approved' };
    
    if (productId) {
      query.productId = productId;
    } else if (professionalId) {
      query.professionalId = professionalId;
    }
    
    const reviews = await Review.find(query);
    
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
  public async getReviews(
    productId?: string,
    professionalId?: string,
    filters?: {
      rating?: number;
      verifiedOnly?: boolean;
      sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
    },
    limit: number = 20,
    skip: number = 0
  ): Promise<{ reviews: ReviewInterface[]; total: number }> {
    const query: any = { status: 'approved' };
    
    if (productId) {
      query.productId = productId;
    } else if (professionalId) {
      query.professionalId = professionalId;
    }
    
    if (filters?.rating) {
      query.rating = filters.rating;
    }
    
    if (filters?.verifiedOnly) {
      query.verifiedPurchase = true;
    }
    
    // Ordenamiento
    let sort: any = { createdAt: -1 }; // Default: más recientes
    if (filters?.sortBy === 'helpful') {
      sort = { likes: -1 };
    } else if (filters?.sortBy === 'rating_high') {
      sort = { rating: -1 };
    } else if (filters?.sortBy === 'rating_low') {
      sort = { rating: 1 };
    }
    
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip),
      Review.countDocuments(query)
    ]);
    
    return { reviews, total };
  }
  
  /**
   * Obtiene un review por ID
   */
  public async getReviewById(reviewId: string): Promise<ReviewInterface | null> {
    return await Review.findById(reviewId);
  }
  
  /**
   * Agrega un like a un review
   */
  public async likeReview(reviewId: string, userId: string): Promise<ReviewInterface | null> {
    const review = await Review.findById(reviewId);
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = review.likedBy.some(id => id.toString() === userId);
    
    if (alreadyLiked) {
      // Unlike
      review.likedBy = review.likedBy.filter(id => id.toString() !== userId);
      review.likes = Math.max(0, review.likes - 1);
    } else {
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
  public async respondToReview(
    reviewId: string,
    responderId: string,
    responseText: string
  ): Promise<ReviewInterface | null> {
    const review = await Review.findById(reviewId);
    
    if (!review) {
      throw new Error('Review not found');
    }
    
    // TODO: Verificar que el responderId sea el dueño del producto/profesional
    
    review.response = {
      text: responseText,
      respondedAt: new Date(),
      respondedBy: new mongoose.Types.ObjectId(responderId)
    };
    
    await review.save();
    
    // Notificar al autor del review
    await notificationService.createNotification({
      userId: review.userId.toString(),
      type: 'new_message' as any, // O crear un tipo específico
      title: 'Respuesta a tu reseña',
      message: `El vendedor ha respondido a tu reseña`,
      actionUrl: `/reviews/${reviewId}`
    });
    
    return review;
  }
  
  /**
   * Reporta un review
   */
  public async flagReview(reviewId: string, reason: string): Promise<ReviewInterface | null> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        status: 'flagged',
        flagReason: reason
      },
      { new: true }
    );
    
    return review;
  }
  
  /**
   * Elimina un review (solo el autor o admin)
   */
  public async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    const review = await Review.findOne({ _id: reviewId, userId });
    
    if (!review) {
      return false;
    }
    
    await review.deleteOne();
    
    // Actualizar promedio de calificación
    if (review.productId) {
      await this.updateProductRating(review.productId.toString());
    } else if (review.professionalId) {
      await this.updateProfessionalRating(review.professionalId.toString());
    }
    
    return true;
  }
}

export default new ReviewService();
