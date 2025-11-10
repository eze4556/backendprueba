"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ReviewSchema = new mongoose_1.Schema({
    productId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'products',
        required: false,
        index: true
    },
    professionalId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'professional',
        required: false,
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    userImage: {
        type: String,
        required: false
    },
    orderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'orders',
        required: false
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: false,
        maxlength: 100
    },
    comment: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 2000
    },
    images: {
        type: [String],
        required: false,
        default: []
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    response: {
        text: { type: String, required: false },
        respondedAt: { type: Date, required: false },
        respondedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'users', required: false }
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'users',
        default: []
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'flagged'],
        default: 'approved' // Auto-aprobar por defecto, moderar después si es necesario
    },
    flagReason: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    versionKey: false
});
// Índices para consultas eficientes
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ professionalId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
// Validación: debe tener productId O professionalId, no ambos ni ninguno
ReviewSchema.pre('validate', function (next) {
    if (!this.productId && !this.professionalId) {
        next(new Error('Review must have either productId or professionalId'));
    }
    else if (this.productId && this.professionalId) {
        next(new Error('Review cannot have both productId and professionalId'));
    }
    else {
        next();
    }
});
exports.default = (0, mongoose_1.model)('reviews', ReviewSchema);
//# sourceMappingURL=review.models.js.map