import { Router } from 'express';
import searchController from '../controllers/search.controller';

const router = Router();

/**
 * GET /api/search
 * Búsqueda global en productos y profesionales
 * Query params: q (required), type (product|professional|all), category, minPrice, maxPrice, minRating, profession, limit, page
 */
router.get('/', (req, res) => {
  searchController.search(req, res);
});

/**
 * GET /api/search/autocomplete
 * Autocomplete para búsqueda rápida
 * Query params: q (required), limit
 */
router.get('/autocomplete', (req, res) => {
  searchController.autocomplete(req, res);
});

/**
 * GET /api/search/category/:categoryId
 * Búsqueda por categoría con filtros y ordenamiento
 * Query params: minPrice, maxPrice, sortBy (price_asc|price_desc|rating|newest), limit, page
 */
router.get('/category/:categoryId', (req, res) => {
  searchController.searchByCategory(req, res);
});

/**
 * GET /api/search/related/:productId
 * Obtener productos relacionados
 * Query params: limit
 */
router.get('/related/:productId', (req, res) => {
  searchController.getRelatedProducts(req, res);
});

/**
 * GET /api/search/popular
 * Productos populares/destacados
 * Query params: limit
 */
router.get('/popular', (req, res) => {
  searchController.getPopularProducts(req, res);
});

/**
 * GET /api/search/top-professionals
 * Profesionales mejor calificados
 * Query params: profession, limit
 */
router.get('/top-professionals', (req, res) => {
  searchController.getTopProfessionals(req, res);
});

export default router;
