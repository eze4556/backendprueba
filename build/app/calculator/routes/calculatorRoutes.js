"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calculatorController_1 = require("../controllers/calculatorController");
const token_1 = __importDefault(require("../../../auth/token/token"));
const user_middlewares_1 = require("../../users/middlewares/user.middlewares"); // Import individual middleware
const router = (0, express_1.Router)();
const calculatorController = new calculatorController_1.CalculatorController();
// Ruta para calcular el precio con datos reales
router.post('/calculate', token_1.default.verifyToken, user_middlewares_1.checkActive, // Use individual middleware
(req, res) => calculatorController.calculate(req, res));
// Ruta alternativa para compatibilidad con frontend (POST /)
router.post('/', token_1.default.verifyToken, user_middlewares_1.checkActive, (req, res) => calculatorController.calculate(req, res));
exports.default = router;
//# sourceMappingURL=calculatorRoutes.js.map