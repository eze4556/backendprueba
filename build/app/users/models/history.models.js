"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const HistorySchema = new mongoose_1.Schema({
    email: { type: String, required: true },
    log: { type: String, required: true },
    createdAt: { type: Number, inmutable: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
exports.default = (0, mongoose_1.model)('history', HistorySchema);
//# sourceMappingURL=history.models.js.map