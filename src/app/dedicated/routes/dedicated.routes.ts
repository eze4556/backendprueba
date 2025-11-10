import express, { Request, Response, NextFunction } from 'express';
import { crearDedicated, obtenerDedicateds, actualizarDedicated, eliminarDedicated, getDedicatedById } from '../controllers/dedicated.controller';
import Token from '../../../auth/token/token';
import { validateObjectId } from '../../../middleware/validateObjectId.middleware';

const router = express.Router();

// Middleware para manejar errores
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Rutas para manejar solicitudes GET (orden importante)
router.get('/', asyncHandler(obtenerDedicateds));
router.get('/:id', validateObjectId('id'), asyncHandler(getDedicatedById));

// Ruta para manejar solicitudes POST
router.post('/crear', Token.verifyToken, asyncHandler(crearDedicated));

// Rutas para manejar solicitudes PUT y DELETE
router.put('/:id', Token.verifyToken, validateObjectId('id'), asyncHandler(actualizarDedicated));
router.delete('/:id', Token.verifyToken, validateObjectId('id'), asyncHandler(eliminarDedicated));

// Middleware para manejar errores
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error in dedicated routes:', err);
    res.status(err.status || 500).json({ 
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

export default router;