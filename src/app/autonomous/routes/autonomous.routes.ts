import express, { Request, Response, NextFunction } from 'express';
import { getAllAutonomous, createAutonomous, getAutonomousRanking, getAutonomousById, updateAutonomous, deleteAutonomous, getAutonomousByCategory } from '../controllers/autonomous.controller';
const router = express.Router();

// Middleware para manejar errores
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Ruta para manejar solicitudes POST
router.post('/', asyncHandler(createAutonomous));

// Rutas para manejar solicitudes GET
router.get('/all', asyncHandler(getAllAutonomous));
router.get('/', asyncHandler(getAutonomousRanking));
router.get('/:id', asyncHandler(getAutonomousById));
router.get('/category/:categoria', asyncHandler(getAutonomousByCategory));

// Rutas para manejar solicitudes PUT y DELETE
router.put('/:id', asyncHandler(updateAutonomous));
router.delete('/:id', asyncHandler(deleteAutonomous));

// Middleware para manejar errores
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

export default router;