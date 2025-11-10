"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicProductsBySeller = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const getPublicProductsBySeller = async (req, res) => {
    var _a;
    try {
        const { sellerId, sellerType } = req.params;
        console.log(`[PUBLIC] === INICIO DE CONSULTA ===`);
        console.log(`[PUBLIC] sellerId: ${sellerId}`);
        console.log(`[PUBLIC] sellerType: ${sellerType}`);
        console.log(`[PUBLIC] MongoDB estado: ${mongoose_1.default.connection.readyState}`);
        console.log(`[PUBLIC] Database name: ${(_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName}`);
        if (!sellerId || !sellerType) {
            return res.status(400).json({
                success: false,
                error: { message: 'sellerId y sellerType son requeridos' }
            });
        }
        const validSellerTypes = ['autonomous', 'dedicated', 'professional'];
        if (!validSellerTypes.includes(sellerType)) {
            return res.status(400).json({
                success: false,
                error: { message: 'sellerType debe ser: autonomous, dedicated o professional' }
            });
        }
        const db = mongoose_1.default.connection.db;
        if (!db) {
            console.error('[PUBLIC] ERROR: db is null or undefined');
            return res.status(500).json({
                success: false,
                error: { message: 'Database connection not available' }
            });
        }
        console.log(`[PUBLIC] Ejecutando query en colección producttypes...`);
        const query = {
            sellerId: sellerId,
            sellerType: sellerType
        };
        console.log(`[PUBLIC] Query:`, JSON.stringify(query));
        const products = await db.collection('producttypes').find(query)
            .project({
            name: 1,
            description: 1,
            price: 1,
            category: 1,
            images: 1,
            stock: 1,
            rating: 1,
            reviews: 1,
            featured: 1,
            sellerId: 1,
            sellerType: 1,
            createdAt: 1
        })
            .sort({ createdAt: -1 })
            .toArray();
        console.log(`[PUBLIC] Productos encontrados: ${products.length}`);
        if (products.length > 0) {
            console.log(`[PUBLIC] Primer producto:`, products[0].name);
        }
        return res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });
    }
    catch (error) {
        console.error('[PUBLIC] ERROR COMPLETO:', error);
        return res.status(500).json({
            success: false,
            error: {
                message: 'Error al obtener productos del vendedor',
                details: error.message
            }
        });
    }
};
exports.getPublicProductsBySeller = getPublicProductsBySeller;
//# sourceMappingURL=publicProducts.controller.js.map