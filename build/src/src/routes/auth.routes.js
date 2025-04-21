"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = __importDefault(require("../auth/token/token"));
const router = (0, express_1.Router)();
router.post('/generate-token', token_1.default.generateToken);
exports.default = router;
