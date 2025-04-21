import express, { Request, Response, NextFunction } from 'express';
import { crearDedicated, obtenerDedicateds, actualizarDedicated, eliminarDedicated, getDedicatedById } from '../controllers/dedicated.controller';
import Token from '../../../auth/token/token';

const router = express.Router();

// Middleware para manejar errores
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Ruta para manejar solicitudes POST
router.post('/crear', Token.verifyToken, asyncHandler(crearDedicated));

// Rutas para manejar solicitudes GET
router.get('/', asyncHandler(obtenerDedicateds));
router.get('/:id', asyncHandler(getDedicatedById));

// Rutas para manejar solicitudes PUT y DELETE
router.put('/:id', Token.verifyToken, asyncHandler(actualizarDedicated));
router.delete('/:id', Token.verifyToken, asyncHandler(eliminarDedicated));

// Middleware para manejar errores
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

export default router;