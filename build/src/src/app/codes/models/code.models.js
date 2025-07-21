"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CodeSchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    expiration: { type: Date, required: true },
    createdAt: { type: Number, immutable: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
exports.default = (0, mongoose_1.model)('codes', CodeSchema);
