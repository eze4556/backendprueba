"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RefreshTokenSchema = new mongoose_1.Schema({
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
        // Nota: index TTL se define con .index() al final del schema
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    ip: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    }
}, { versionKey: false });
// Índice TTL para auto-eliminar tokens expirados
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.default = (0, mongoose_1.model)('refresh_tokens', RefreshTokenSchema);
//# sourceMappingURL=refresh-token.models.js.map