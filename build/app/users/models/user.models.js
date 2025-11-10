"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    primary_data: {
        name: { type: String, required: true },
        last_name: { type: String, required: true },
        phone: { type: String, required: false },
        email: {
            type: String,
            lowercase: true,
            required: [true, "can't be blank"],
            match: [/\S+@\S+\.\S+/, 'is invalid'],
        },
        nickname: { type: String, required: true },
        type: { type: String, required: true },
        description: { type: String, required: true },
    },
    billing_data: {
        doc_number: { type: Number, required: false },
        cuit_cuil: { type: Number, required: false },
        taxpayer_type: { type: String, required: false },
        bussiness_name: { type: String, required: false },
        city_name: { type: String, required: false },
        street_name: { type: String, required: false },
        street_number: { type: Number, required: false },
        state_name: { type: String, required: false },
        zip_code: { type: Number, required: false },
        comment: { type: String, required: false },
    },
    auth_data: {
        password: { type: String, required: true },
    },
    personal_info: {
        dni: { type: String, required: false },
        areaCode: { type: String, required: false },
        phone: { type: String, required: false },
        location: { type: String, required: false },
        birthDate: { type: String, required: false },
        receiveNews: { type: Boolean, default: false }
    },
    permissions: {
        active: { type: Boolean, default: true, required: true },
        allow_password_change: { type: Boolean, default: false, required: true },
    },
    profile_image: { type: String, required: false },
    createdAt: { type: Number, immutable: true },
    updatedAt: { type: Number },
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });
exports.default = (0, mongoose_1.model)('users', UserSchema);
//# sourceMappingURL=user.models.js.map