"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    primary_data: {
        name: { type: String, required: true },
        last_name: { type: String, required: true },
        phone: { type: String, required: true },
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
    permissions: {
        active: { type: Boolean, default: true, required: true },
        allow_password_change: { type: Boolean, default: false, required: true },
    },
    createdAt: { type: Number, immutable: true },
    updatedAt: { type: Number },
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });
exports.default = (0, mongoose_1.model)('users', UserSchema);
