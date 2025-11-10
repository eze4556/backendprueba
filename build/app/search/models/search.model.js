"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SearchSchema = new mongoose_1.Schema({
    search: { type: Array, required: true },
    raw_search: { type: String, required: true },
    createdAt: { type: Number, inmutable: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
exports.default = (0, mongoose_1.model)('search', SearchSchema);
//# sourceMappingURL=search.model.js.map