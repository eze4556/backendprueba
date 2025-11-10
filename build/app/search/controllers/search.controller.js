"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const search_service_1 = __importDefault(require("../services/search.service"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const mongoose_1 = __importDefault(require("mongoose"));
class SearchController {
    /**
     * GET /api/search
     * Búsqueda global
     * Query params: q, type, category, minPrice, maxPrice, minRating, profession, limit, page
     */
    async search(req, res) {
        try {
            const { q, type, category, minPrice, maxPrice, minRating, profession, limit = 10, page = 1 } = req.query;
            if (!q || typeof q !== 'string') {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Search query is required'
                });
            }
            const filters = {};
            if (category)
                filters.category = category;
            if (minPrice)
                filters.minPrice = parseFloat(minPrice);
            if (maxPrice)
                filters.maxPrice = parseFloat(maxPrice);
            if (minRating)
                filters.minRating = parseFloat(minRating);
            if (profession)
                filters.profession = profession;
            const result = await search_service_1.default.globalSearch(q, type, filters, parseInt(limit), parseInt(page));
            return handler_helper_1.default.success(res, {
                query: q,
                type: type || 'all',
                filters,
                results: result,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        }
        catch (error) {
            console.error('Search error:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Search failed'
            });
        }
    }
    /**
     * GET /api/search/autocomplete
     * Autocomplete para búsqueda rápida
     * Query params: q, limit
     */
    async autocomplete(req, res) {
        try {
            const { q, limit = 5 } = req.query;
            if (!q || typeof q !== 'string') {
                return handler_helper_1.default.success(res, { suggestions: [] });
            }
            const suggestions = await search_service_1.default.autocomplete(q, parseInt(limit));
            return handler_helper_1.default.success(res, { suggestions });
        }
        catch (error) {
            console.error('Autocomplete error:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Autocomplete failed'
            });
        }
    }
    /**
     * GET /api/search/category/:categoryId
     * Búsqueda por categoría con filtros
     * Query params: minPrice, maxPrice, sortBy, limit, page
     */
    async searchByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const { minPrice, maxPrice, sortBy = 'newest', limit = 20, page = 1 } = req.query;
            // Validar ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Invalid category ID format'
                });
            }
            const filters = {};
            if (minPrice)
                filters.minPrice = parseFloat(minPrice);
            if (maxPrice)
                filters.maxPrice = parseFloat(maxPrice);
            const result = await search_service_1.default.searchByCategory(categoryId, filters, parseInt(limit), parseInt(page), sortBy);
            return handler_helper_1.default.success(res, result);
        }
        catch (error) {
            console.error('Category search error:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Category search failed'
            });
        }
    }
    /**
     * GET /api/search/related/:productId
     * Productos relacionados
     */
    async getRelatedProducts(req, res) {
        try {
            const { productId } = req.params;
            const { limit = 5 } = req.query;
            // Validar ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(productId)) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Invalid product ID format'
                });
            }
            const related = await search_service_1.default.getRelatedProducts(productId, parseInt(limit));
            return handler_helper_1.default.success(res, { products: related });
        }
        catch (error) {
            console.error('Related products error:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get related products'
            });
        }
    }
    /**
     * GET /api/search/popular
     * Productos populares/destacados
     */
    async getPopularProducts(req, res) {
        try {
            const { limit = 10 } = req.query;
            const products = await search_service_1.default.getPopularProducts(parseInt(limit));
            return handler_helper_1.default.success(res, { products });
        }
        catch (error) {
            console.error('Popular products error:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get popular products'
            });
        }
    }
    /**
     * GET /api/search/top-professionals
     * Profesionales mejor calificados
     * Query params: profession, limit
     */
    async getTopProfessionals(req, res) {
        try {
            const { profession, limit = 10 } = req.query;
            const professionals = await search_service_1.default.getTopProfessionals(parseInt(limit), profession);
            return handler_helper_1.default.success(res, { professionals });
        }
        catch (error) {
            console.error('Top professionals error:', error);
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message || 'Failed to get top professionals'
            });
        }
    }
}
exports.default = new SearchController();
//# sourceMappingURL=search.controller.js.map