"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculatorController = void 0;
const calculatorService_1 = require("../services/calculatorService");
class CalculatorController {
    constructor() {
        this.calculatorService = new calculatorService_1.CalculatorService();
    }
    async calculate(req, res) {
        try {
            const { productId, planType, paymentMethod } = req.body;
            if (!productId || !planType || !paymentMethod) {
                res.status(400).json({ error: 'Datos de entrada inválidos' });
                return;
            }
            const calculationResult = await this.calculatorService.calculateTotal(productId, planType, paymentMethod);
            res.status(200).json({
                success: true,
                data: calculationResult
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}
exports.CalculatorController = CalculatorController;
