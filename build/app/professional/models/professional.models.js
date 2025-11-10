"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const professionalSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    profession: { type: String, required: true },
    experience: { type: Number, required: true },
    score: { type: Number, required: true }, // Añadir este campo
    categorie: { type: String, required: true }
});
exports.default = (0, mongoose_1.model)('Professional', professionalSchema);
//# sourceMappingURL=professional.models.js.map