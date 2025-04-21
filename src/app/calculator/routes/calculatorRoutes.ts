import { Router, Request, Response } from 'express';
import { CalculatorController } from '../controllers/calculatorController';
import Token from '../../../auth/token/token';
import { checkActive } from '../../users/middlewares/user.middlewares'; // Import individual middleware

const router = Router();
const calculatorController = new CalculatorController();

// Ruta para calcular el precio con datos reales
router.get(
    '/calculate', 
    Token.verifyToken, 
    checkActive, // Use individual middleware
    (req: Request, res: Response) => calculatorController.calculate(req, res)
);

export default router;