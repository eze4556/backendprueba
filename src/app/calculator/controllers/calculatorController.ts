import { Request, Response } from 'express';
import { CalculatorService } from '../services/calculatorService';

export class CalculatorController {
    private calculatorService: CalculatorService;

    constructor() {
        this.calculatorService = new CalculatorService();
    }

    public async calculate(req: Request, res: Response): Promise<void> {
        try {
            const { productId, planType, paymentMethod } = req.body;

            if (!productId || !planType || !paymentMethod) {
                res.status(400).json({ error: 'Datos de entrada inválidos' });
                return;
            }

            const calculationResult = await this.calculatorService.calculateTotal(
                productId,
                planType,
                paymentMethod
            );
            
            res.status(200).json({ 
                success: true,
                data: calculationResult
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: (error as Error).message 
            });
        }
    }
}