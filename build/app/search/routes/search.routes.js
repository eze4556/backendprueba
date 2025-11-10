"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = __importDefault(require("../controllers/search.controller"));
const router = (0, express_1.Router)();
/**
 * GET /api/search
 * Búsqueda global en productos y profesionales
 * Query params: q (required), type (product|professional|all), category, minPrice, maxPrice, minRating, profession, limit, page
 */
router.get('/', (req, res) => {
    search_controller_1.default.search(req, res);
});
/**
 * GET /api/search/autocomplete
 * Autocomplete para búsqueda rápida
 * Query params: q (required), limit
 */
router.get('/autocomplete', (req, res) => {
    search_controller_1.default.autocomplete(req, res);
});
/**
 * GET /api/search/category/:categoryId
 * Búsqueda por categoría con filtros y ordenamiento
 * Query params: minPrice, maxPrice, sortBy (price_asc|price_desc|rating|newest), limit, page
 */
router.get('/category/:categoryId', (req, res) => {
    search_controller_1.default.searchByCategory(req, res);
});
/**
 * GET /api/search/related/:productId
 * Obtener productos relacionados
 * Query params: limit
 */
router.get('/related/:productId', (req, res) => {
    search_controller_1.default.getRelatedProducts(req, res);
});
/**
 * GET /api/search/popular
 * Productos populares/destacados
 * Query params: limit
 */
router.get('/popular', (req, res) => {
    search_controller_1.default.getPopularProducts(req, res);
});
/**
 * GET /api/search/top-professionals
 * Profesionales mejor calificados
 * Query params: profession, limit
 */
router.get('/top-professionals', (req, res) => {
    search_controller_1.default.getTopProfessionals(req, res);
});
exports.default = router;
//# sourceMappingURL=search.routes.js.map