"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categorie_controllers_1 = __importDefault(require("../controllers/categorie.controllers"));
const token_1 = __importDefault(require("../../../auth/token/token"));
const router = (0, express_1.Router)();
/**
 * @route   GET /api/categorie
 * @desc    Obtener todas las categorías (PÚBLICO)
 * @access  Public
 */
router.get('/', categorie_controllers_1.default.getData);
/**
 * @route   POST /api/categorie/get_data
 * @desc    Obtener categorías (método alternativo - protegido)
 * @access  Private
 */
router.post('/get_data', token_1.default.verifyToken, categorie_controllers_1.default.getData);
exports.default = router;
//# sourceMappingURL=categorie.routes.js.map