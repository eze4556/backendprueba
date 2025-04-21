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
        doc_number: { type: Number, require: false },
        cuit_cuil: { type: Number, require: false },
        taxpayer_type: { type: String, require: false },
        bussiness_name: { type: String, require: false },
        city_name: { type: String, require: false },
        street_name: { type: String, require: false },
        street_number: { type: Number, require: false },
        state_name: { type: String, require: false },
        zip_code: { type: Number, require: false },
        comment: { type: String, require: false },
    },
    auth_data: {
        password: { type: String, required: true },
    },
    permissions: {
        active: { type: Boolean, default: true, required: true },
        allow_password_change: { type: Boolean, default: false, required: true },
    },
    createdAt: { type: Number, inmutable: true },
    updatedAt: { type: Number },
}, { timestamps: { createdAt: true, updatedAt: true }, versionKey: false });
exports.default = (0, mongoose_1.model)('users', UserSchema);
