"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PasswordResetSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true
        // Nota: Los índices se manejan explícitamente con .index() al final
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    }
}, { versionKey: false });
// Índice TTL para auto-eliminar tokens expirados después de 24 horas
PasswordResetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
exports.default = (0, mongoose_1.model)('password_resets', PasswordResetSchema);
//# sourceMappingURL=password-reset.models.js.map