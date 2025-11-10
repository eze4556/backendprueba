import { Request, Response } from 'express';
import searchService from '../services/search.service';
import HttpHandler from '../../../helpers/handler.helper';
import { SUCCESS, BAD_REQUEST, INTERNAL_ERROR } from '../../../constants/codes.constanst';
import mongoose from 'mongoose';

class SearchController {
  
  /**
   * GET /api/search
   * Búsqueda global
   * Query params: q, type, category, minPrice, maxPrice, minRating, profession, limit, page
   */
  public async search(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        q, 
        type, 
        category, 
        minPrice, 
        maxPrice, 
        minRating,
        profession,
        limit = 10, 
        page = 1 
      } = req.query;
      
      if (!q || typeof q !== 'string') {
        return HttpHandler.error(res, { 
          code: BAD_REQUEST, 
          message: 'Search query is required' 
        });
      }
      
      const filters: any = {};
      if (category) filters.category = category as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (minRating) filters.minRating = parseFloat(minRating as string);
      if (profession) filters.profession = profession as string;
      
      const result = await searchService.globalSearch(
        q,
        type as any,
        filters,
        parseInt(limit as string),
        parseInt(page as string)
      );
      
      return HttpHandler.success(res, { 
        query: q,
        type: type || 'all',
        filters,
        results: result,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      });
      
    } catch (error: any) {
      console.error('Search error:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Search failed' 
      });
    }
  }
  
  /**
   * GET /api/search/autocomplete
   * Autocomplete para búsqueda rápida
   * Query params: q, limit
   */
  public async autocomplete(req: Request, res: Response): Promise<Response> {
    try {
      const { q, limit = 5 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return HttpHandler.success(res, { suggestions: [] });
      }
      
      const suggestions = await searchService.autocomplete(
        q,
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, { suggestions });
      
    } catch (error: any) {
      console.error('Autocomplete error:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Autocomplete failed' 
      });
    }
  }
  
  /**
   * GET /api/search/category/:categoryId
   * Búsqueda por categoría con filtros
   * Query params: minPrice, maxPrice, sortBy, limit, page
   */
  public async searchByCategory(req: Request, res: Response): Promise<Response> {
    try {
      const { categoryId } = req.params;
      const { 
        minPrice, 
        maxPrice, 
        sortBy = 'newest',
        limit = 20, 
        page = 1 
      } = req.query;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Invalid category ID format'
        });
      }
      
      const filters: any = {};
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      
      const result = await searchService.searchByCategory(
        categoryId,
        filters,
        parseInt(limit as string),
        parseInt(page as string),
        sortBy as any
      );
      
      return HttpHandler.success(res, result);
      
    } catch (error: any) {
      console.error('Category search error:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Category search failed' 
      });
    }
  }
  
  /**
   * GET /api/search/related/:productId
   * Productos relacionados
   */
  public async getRelatedProducts(req: Request, res: Response): Promise<Response> {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      // Validar ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return HttpHandler.error(res, {
          code: BAD_REQUEST,
          message: 'Invalid product ID format'
        });
      }
      
      const related = await searchService.getRelatedProducts(
        productId,
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, { products: related });
      
    } catch (error: any) {
      console.error('Related products error:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to get related products' 
      });
    }
  }
  
  /**
   * GET /api/search/popular
   * Productos populares/destacados
   */
  public async getPopularProducts(req: Request, res: Response): Promise<Response> {
    try {
      const { limit = 10 } = req.query;
      
      const products = await searchService.getPopularProducts(
        parseInt(limit as string)
      );
      
      return HttpHandler.success(res, { products });
      
    } catch (error: any) {
      console.error('Popular products error:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to get popular products' 
      });
    }
  }
  
  /**
   * GET /api/search/top-professionals
   * Profesionales mejor calificados
   * Query params: profession, limit
   */
  public async getTopProfessionals(req: Request, res: Response): Promise<Response> {
    try {
      const { profession, limit = 10 } = req.query;
      
      const professionals = await searchService.getTopProfessionals(
        parseInt(limit as string),
        profession as string
      );
      
      return HttpHandler.success(res, { professionals });
      
    } catch (error: any) {
      console.error('Top professionals error:', error);
      return HttpHandler.error(res, { 
        code: INTERNAL_ERROR, 
        message: error.message || 'Failed to get top professionals' 
      });
    }
  }
}

export default new SearchController();
