"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cart_models_1 = __importDefault(require("../models/cart.models"));
const mongoose_1 = __importDefault(require("mongoose"));
class CartService {
    /**
     * Obtener carrito de un usuario
     */
    async getCart(userId) {
        try {
            const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
            let cart = await cart_models_1.default.findOne({ userId: userObjectId });
            if (!cart) {
                // Crear carrito vacío si no existe
                cart = await cart_models_1.default.create({
                    userId: userObjectId,
                    items: [],
                    totalItems: 0,
                    totalAmount: 0
                });
            }
            // NO hacer populate porque causa error si el modelo no está registrado
            // Los datos del producto ya están almacenados en cada item
            return cart;
        }
        catch (error) {
            console.error('Error in getCart:', error);
            throw error;
        }
    }
    /**
     * Agregar producto al carrito
     */
    async addItem(userId, productId, quantity = 1, productData) {
        let cart = await cart_models_1.default.findOne({ userId });
        if (!cart) {
            cart = new cart_models_1.default({
                userId,
                items: []
            });
        }
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (existingItemIndex > -1) {
            // Actualizar cantidad del producto existente
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].subtotal =
                cart.items[existingItemIndex].quantity * cart.items[existingItemIndex].price;
        }
        else {
            // Agregar nuevo producto
            const newItem = {
                productId: new mongoose_1.default.Types.ObjectId(productId),
                productName: productData.name,
                productImage: productData.image,
                price: productData.price,
                quantity,
                subtotal: productData.price * quantity,
                providerId: new mongoose_1.default.Types.ObjectId(productData.providerId)
            };
            cart.items.push(newItem);
        }
        await cart.save();
        return cart;
    }
    /**
     * Actualizar cantidad de un producto
     */
    async updateItemQuantity(userId, productId, quantity) {
        const cart = await cart_models_1.default.findOne({ userId });
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            throw new Error('Producto no encontrado en el carrito');
        }
        if (quantity <= 0) {
            // Eliminar producto si la cantidad es 0 o negativa
            cart.items.splice(itemIndex, 1);
        }
        else {
            // Actualizar cantidad
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].subtotal = cart.items[itemIndex].price * quantity;
        }
        await cart.save();
        return cart;
    }
    /**
     * Eliminar producto del carrito
     */
    async removeItem(userId, productId) {
        const cart = await cart_models_1.default.findOne({ userId });
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        return cart;
    }
    /**
     * Limpiar carrito
     */
    async clearCart(userId) {
        const cart = await cart_models_1.default.findOne({ userId });
        if (!cart) {
            throw new Error('Carrito no encontrado');
        }
        cart.items = [];
        await cart.save();
        return cart;
    }
    /**
     * Sincronizar carrito (merge de carrito local con servidor)
     */
    async syncCart(userId, localItems) {
        let cart = await cart_models_1.default.findOne({ userId });
        if (!cart) {
            cart = new cart_models_1.default({
                userId,
                items: []
            });
        }
        // Merge de items locales con items del servidor
        for (const localItem of localItems) {
            const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === localItem.productId.toString());
            if (existingItemIndex > -1) {
                // Tomar la cantidad mayor
                const maxQuantity = Math.max(cart.items[existingItemIndex].quantity, localItem.quantity);
                cart.items[existingItemIndex].quantity = maxQuantity;
                cart.items[existingItemIndex].subtotal =
                    cart.items[existingItemIndex].price * maxQuantity;
            }
            else {
                // Agregar item local que no está en el servidor
                cart.items.push(localItem);
            }
        }
        await cart.save();
        return cart;
    }
    /**
     * Validar disponibilidad de stock antes de checkout
     */
    async validateStock(userId) {
        const cart = await cart_models_1.default.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            throw new Error('Carrito vacío');
        }
        const unavailableItems = [];
        for (const item of cart.items) {
            const product = item.productId;
            // Verificar disponibilidad
            if (product.availability !== 'available') {
                unavailableItems.push(item.productName);
            }
            // Verificar stock si aplica
            if (product.stock !== undefined && product.stock < item.quantity) {
                unavailableItems.push(`${item.productName} (stock insuficiente: ${product.stock} disponibles)`);
            }
        }
        if (unavailableItems.length > 0) {
            throw new Error(`Productos no disponibles: ${unavailableItems.join(', ')}`);
        }
        return true;
    }
}
exports.default = new CartService();
//# sourceMappingURL=cart.service.js.map