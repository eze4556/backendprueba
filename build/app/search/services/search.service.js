"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const productTypes_models_1 = __importDefault(require("../../productTypes/models/productTypes.models"));
const professional_models_1 = __importDefault(require("../../professional/models/professional.models"));
class SearchService {
    /**
     * Búsqueda global en productos y profesionales
     */
    async globalSearch(query, type, filters, limit = 10, page = 1) {
        const skip = (page - 1) * limit;
        const searchType = type || 'all';
        const result = {
            products: [],
            professionals: [],
            total: { products: 0, professionals: 0 }
        };
        // Búsqueda en productos
        if (searchType === 'product' || searchType === 'all') {
            const productQuery = {
                $or: [
                    { 'product_info.name': { $regex: query, $options: 'i' } },
                    { 'product_info.description': { $regex: query, $options: 'i' } },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ]
            };
            // Aplicar filtros
            if (filters === null || filters === void 0 ? void 0 : filters.category) {
                productQuery.categorie = filters.category;
            }
            if ((filters === null || filters === void 0 ? void 0 : filters.minPrice) || (filters === null || filters === void 0 ? void 0 : filters.maxPrice)) {
                productQuery['product_info.price'] = {};
                if (filters.minPrice)
                    productQuery['product_info.price'].$gte = filters.minPrice;
                if (filters.maxPrice)
                    productQuery['product_info.price'].$lte = filters.maxPrice;
            }
            result.total.products = await productTypes_models_1.default.countDocuments(productQuery);
            result.products = await productTypes_models_1.default.find(productQuery)
                .populate('user', 'name email')
                .populate('categorie', 'name')
                .skip(skip)
                .limit(limit)
                .select('product_info product_status tags createdAt')
                .lean();
        }
        // Búsqueda en profesionales
        if (searchType === 'professional' || searchType === 'all') {
            const professionalQuery = {
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { profession: { $regex: query, $options: 'i' } },
                    { categorie: { $regex: query, $options: 'i' } }
                ]
            };
            // Aplicar filtros
            if (filters === null || filters === void 0 ? void 0 : filters.profession) {
                professionalQuery.profession = { $regex: filters.profession, $options: 'i' };
            }
            if (filters === null || filters === void 0 ? void 0 : filters.minRating) {
                professionalQuery.score = { $gte: filters.minRating };
            }
            result.total.professionals = await professional_models_1.default.countDocuments(professionalQuery);
            result.professionals = await professional_models_1.default.find(professionalQuery)
                .skip(skip)
                .limit(limit)
                .select('name profession experience score categorie')
                .lean();
        }
        return result;
    }
    /**
     * Autocomplete para búsqueda rápida
     */
    async autocomplete(query, limit = 5) {
        if (!query || query.length < 2) {
            return [];
        }
        const regex = new RegExp(`^${query}`, 'i');
        // Buscar productos
        const products = await productTypes_models_1.default.find({
            'product_info.name': regex
        })
            .limit(limit)
            .select('product_info.name product_info.imageUrl')
            .lean();
        // Buscar profesionales
        const professionals = await professional_models_1.default.find({
            name: regex
        })
            .limit(limit)
            .select('name profession')
            .lean();
        // Combinar resultados
        const suggestions = [
            ...products.map(p => ({
                type: 'product',
                id: p._id,
                name: p.product_info.name,
                imageUrl: p.product_info.imageUrl
            })),
            ...professionals.map(p => ({
                type: 'professional',
                id: p._id,
                name: p.name,
                profession: p.profession
            }))
        ];
        return suggestions.slice(0, limit);
    }
    /**
     * Búsqueda por categoría con filtros avanzados
     */
    async searchByCategory(categoryId, filters, limit = 20, page = 1, sortBy = 'newest') {
        const skip = (page - 1) * limit;
        const query = { categorie: categoryId };
        // Aplicar filtros
        if ((filters === null || filters === void 0 ? void 0 : filters.minPrice) || (filters === null || filters === void 0 ? void 0 : filters.maxPrice)) {
            query['product_info.price'] = {};
            if (filters.minPrice)
                query['product_info.price'].$gte = filters.minPrice;
            if (filters.maxPrice)
                query['product_info.price'].$lte = filters.maxPrice;
        }
        // Determinar ordenamiento
        let sort = { createdAt: -1 };
        switch (sortBy) {
            case 'price_asc':
                sort = { 'product_info.price': 1 };
                break;
            case 'price_desc':
                sort = { 'product_info.price': -1 };
                break;
            case 'rating':
                sort = { 'product_info.rating': -1 };
                break;
            case 'newest':
            default:
                sort = { createdAt: -1 };
        }
        const total = await productTypes_models_1.default.countDocuments(query);
        const products = await productTypes_models_1.default.find(query)
            .populate('user', 'name')
            .populate('categorie', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();
        return {
            products,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        };
    }
    /**
     * Obtener productos relacionados (por tags y categoría)
     */
    async getRelatedProducts(productId, limit = 5) {
        const product = await productTypes_models_1.default.findById(productId).select('tags categorie').lean();
        if (!product) {
            throw new Error('Product not found');
        }
        const query = {
            _id: { $ne: productId },
            $or: [
                { categorie: product.categorie },
                { tags: { $in: product.tags } }
            ]
        };
        const related = await productTypes_models_1.default.find(query)
            .limit(limit)
            .select('product_info tags')
            .lean();
        return related;
    }
    /**
     * Productos populares/destacados
     */
    async getPopularProducts(limit = 10) {
        const products = await productTypes_models_1.default.find({
            'product_status.status': 'active'
        })
            .sort({ 'associate.length': -1, createdAt: -1 })
            .limit(limit)
            .populate('user', 'name')
            .populate('categorie', 'name')
            .select('product_info tags')
            .lean();
        return products;
    }
    /**
     * Profesionales mejor calificados
     */
    async getTopProfessionals(limit = 10, profession) {
        const query = {};
        if (profession) {
            query.profession = { $regex: profession, $options: 'i' };
        }
        const professionals = await professional_models_1.default.find(query)
            .sort({ score: -1, experience: -1 })
            .limit(limit)
            .lean();
        return professionals;
    }
}
exports.default = new SearchService();
//# sourceMappingURL=search.service.js.map