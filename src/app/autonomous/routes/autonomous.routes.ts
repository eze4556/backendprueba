import express, { Request, Response, NextFunction } from 'express';
import { getAllAutonomous, createAutonomous, getAutonomousRanking, getAutonomousById, updateAutonomous, deleteAutonomous, getAutonomousByCategory } from '../controllers/autonomous.controller';
import { 
  extractRoleInfo,
  requirePermissions,
  canModify
} from '../../../middleware/role-validation.middleware';
import { Permission } from '../../../interfaces/roles.interface';

const router = express.Router();

// Middleware para manejar errores
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Ruta para crear autónomo (PROTEGIDA con validación de roles)
router.post('/', 
  extractRoleInfo,
  canModify,
  requirePermissions(Permission.CREATE_AUTONOMOUS),
  asyncHandler(createAutonomous)
);

// Rutas de consulta (requieren autenticación básica)
router.get('/all', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_AUTONOMOUS),
  asyncHandler(getAllAutonomous)
);

router.get('/', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_AUTONOMOUS),
  asyncHandler(getAutonomousRanking)
);

router.get('/:id', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_AUTONOMOUS),
  asyncHandler(getAutonomousById)
);

router.get('/category/:categoria', 
  extractRoleInfo,
  requirePermissions(Permission.VIEW_AUTONOMOUS),
  asyncHandler(getAutonomousByCategory)
);

// Rutas de modificación (requieren permisos especiales)
router.put('/:id', 
  extractRoleInfo,
  canModify,
  requirePermissions(Permission.EDIT_AUTONOMOUS),
  asyncHandler(updateAutonomous)
);

router.delete('/:id', 
  extractRoleInfo,
  canModify,
  requirePermissions(Permission.DELETE_AUTONOMOUS),
  asyncHandler(deleteAutonomous)
);

// Middleware para manejar errores
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ message: err.message });
});

export default router;