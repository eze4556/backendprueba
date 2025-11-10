"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const WishlistItemSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        required: false
    },
    currentPrice: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        required: false,
        min: 0
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    priceAlertEnabled: {
        type: Boolean,
        default: false
    },
    alertThreshold: {
        type: Number,
        required: false,
        min: 0
    }
}, { _id: false });
const WishlistSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true,
        index: true
    },
    items: {
        type: [WishlistItemSchema],
        default: []
    }
}, {
    timestamps: { createdAt: false, updatedAt: true },
    versionKey: false
});
// Índice para búsquedas de productos en la wishlist
WishlistSchema.index({ 'items.productId': 1 });
exports.default = (0, mongoose_1.model)('wishlists', WishlistSchema);
//# sourceMappingURL=wishlist.models.js.map