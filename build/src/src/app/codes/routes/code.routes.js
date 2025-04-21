"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = __importDefault(require("../../../auth/token/token"));
const code_middlewares_1 = __importDefault(require("../middlewares/code.middlewares"));
const router = (0, express_1.Router)();
router.post('/validate', token_1.default.verifyToken, // Verify token
code_middlewares_1.default.validateCode, // Validate sent code
token_1.default.generateToken // Generate token
);
exports.default = router;
