import { Response } from 'express';
import { AuthRequest } from '../../../interfaces/auth.interface';
import reviewService from '../services/review.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, CREATED, BAD_REQUEST, NOT_FOUND, FORBIDDEN, INTERNAL_ERROR } from '../../../constants/codes.constanst';

class ReviewController {
  
  /**
   * GET /api/reviews
   * Lista todos los reviews (con paginación)
   */
  public async getAllReviews(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      const sortBy = req.query.sortBy as any || 'createdAt';
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      
      const result = await reviewService.getReviews(
        undefined,
        undefined,
        { rating, sortBy },
        limit,
        skip
      );
      
      return HttpHandler.success(res, {
        message: 'Reviews retrieved successfully',
        reviews: result.reviews,
        pagination: {
          total: result.total,
          page,
          limit,
          pages: Math.ceil(result.total / limit)
        }
      });
      
    } catch (error: any) {
      console.error('Error getting all reviews:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to get reviews' 
      });
    }
  }
  
  /**
   * POST /api/reviews
   * Crea un nuevo review
   */
  public async createReview(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user!.id;
      const {
        productId,
        professionalId,
        orderId,
        rating,
        title,
        comment,
        images
      } = req.body;
      
      // Validaciones
      if (!productId && !professionalId) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Must provide either productId or professionalId' 
        });
      }
      
      if (!rating || rating < 1 || rating > 5) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Rating must be between 1 and 5' 
        });
      }
      
      if (!comment || comment.length < 10) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Comment must be at least 10 characters long' 
        });
      }
      
      // Obtener nombre de usuario (en producción, obtener de la BD)
      const userName = 'Usuario'; // TODO: obtener del user
      
      const review = await reviewService.createReview({
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
      
      return HttpHandler.success(res, { 
        message: 'Review created successfully',
        review 
      }, CREATED);
      
    } catch (error: any) {
      console.error('Error creating review:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to create review' 
      });
    }
  }
  
  /**
   * GET /api/reviews/product/:productId
   * Obtiene reviews de un producto
   */
  public async getProductReviews(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { productId } = req.params;
      
      // Validar que productId sea un ObjectId válido
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return HttpHandler.success(res, {
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
      
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const verifiedOnly = req.query.verifiedOnly === 'true';
      const sortBy = req.query.sortBy as any;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      
      const result = await reviewService.getReviews(
        productId,
        undefined,
        { rating, verifiedOnly, sortBy },
        limit,
        skip
      );
      
      // Obtener estadísticas
      const stats = await reviewService.getReviewStats(productId);
      
      return HttpHandler.success(res, {
        reviews: result.reviews,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
        stats
      });
      
    } catch (error: any) {
      console.error('Error fetching product reviews:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to fetch reviews' 
      });
    }
  }
  
  /**
   * GET /api/reviews/professional/:professionalId
   * Obtiene reviews de un profesional
   */
  public async getProfessionalReviews(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { professionalId } = req.params;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const verifiedOnly = req.query.verifiedOnly === 'true';
      const sortBy = req.query.sortBy as any;
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * limit;
      
      const result = await reviewService.getReviews(
        undefined,
        professionalId,
        { rating, verifiedOnly, sortBy },
        limit,
        skip
      );
      
      // Obtener estadísticas
      const stats = await reviewService.getReviewStats(undefined, professionalId);
      
      return HttpHandler.success(res, {
        reviews: result.reviews,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
        stats
      });
      
    } catch (error: any) {
      console.error('Error fetching professional reviews:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to fetch reviews' 
      });
    }
  }
  
  /**
   * POST /api/reviews/:id/like
   * Da like o unlike a un review
   */
  public async likeReview(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const review = await reviewService.likeReview(id, userId);
      
      if (!review) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Review not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Review updated',
        review 
      });
      
    } catch (error: any) {
      console.error('Error liking review:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to like review' 
      });
    }
  }
  
  /**
   * POST /api/reviews/:id/respond
   * Responde a un review (vendedor/profesional)
   */
  public async respondToReview(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { response } = req.body;
      
      if (!response || response.length < 10) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Response must be at least 10 characters long' 
        });
      }
      
      const review = await reviewService.respondToReview(id, userId, response);
      
      if (!review) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Review not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Response added successfully',
        review 
      });
      
    } catch (error: any) {
      console.error('Error responding to review:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to respond to review' 
      });
    }
  }
  
  /**
   * POST /api/reviews/:id/flag
   * Reporta un review
   */
  public async flagReview(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Reason is required' 
        });
      }
      
      const review = await reviewService.flagReview(id, reason);
      
      if (!review) {
        return HttpHandler.error(res, { code: NOT_FOUND, message: 'Review not found' });
      }
      
      return HttpHandler.success(res, { 
        message: 'Review flagged for moderation',
        review 
      });
      
    } catch (error: any) {
      console.error('Error flagging review:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to flag review' 
      });
    }
  }
  
  /**
   * DELETE /api/reviews/:id
   * Elimina un review
   */
  public async deleteReview(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      const deleted = await reviewService.deleteReview(id, userId);
      
      if (!deleted) {
        return HttpHandler.error(res, { 
          code: NOT_FOUND, 
          message: 'Review not found or unauthorized' 
        });
      }
      
      return HttpHandler.success(res, { message: 'Review deleted successfully' });
      
    } catch (error: any) {
      console.error('Error deleting review:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to delete review' 
      });
    }
  }
}

export default new ReviewController();
