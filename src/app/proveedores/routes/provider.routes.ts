import { Request, Response, Router, NextFunction } from 'express';
import { authMiddleware } from '../../../middleware/auth.middleware';
import adminAuthMiddleware from '../../../middleware/admin-auth.middleware';
import providerMiddleware from '../middleware/provider.middleware';
import ProviderController from '../controller/provider.controller';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();
const providerController = new ProviderController();

/**
 * @route   POST /api/providers
 * @desc    Registrar un nuevo proveedor
 * @access  Private
 */
router.post('/', (req: Request, res: Response) => {
  providerController.registerProvider(req as AuthRequest, res);
});

/**
 * @route   GET /api/providers
 * @desc    Obtener todos los proveedores
 * @access  Admin
 */
router.get('/', (req: Request, res: Response) => {
  providerController.getAllProviders(req as AuthRequest, res);
});

/**
 * @route   GET /api/providers/pending
 * @desc    Obtener proveedores pendientes de aprobación
 * @access  Admin
 */
router.get('/pending', (req: AuthRequest, res: Response) => {
  providerController.getPendingProviders(req, res);
});

/**
 * @route   GET /api/providers/:providerId
 * @desc    Obtener un proveedor por ID
 * @access  Private (Provider/Admin)
 */
router.get(
  '/:providerId',
  (req: Request, res: Response, next) => providerMiddleware.isProviderOrAdmin(req as any, res, next),
  (req: Request, res: Response) => {
    providerController.getProviderById(req, res);
  }
);

/**
 * @route   PUT /api/providers/:providerId
 * @desc    Actualizar información de un proveedor
 * @access  Private (Provider/Admin)
 */
router.put(
  '/:providerId',
  (req: Request, res: Response, next) => providerMiddleware.isProviderOrAdmin(req as any, res, next),
  (req: Request, res: Response) => {
    providerController.updateProvider(req, res);
  }
);

/**
 * @route   POST /api/providers/:providerId/approve
 * @desc    Aprobar un proveedor
 * @access  Admin
 */
router.post('/:providerId/approve', (req: Request, res: Response) => {
  providerController.approveProvider(req as AuthRequest, res);
});

/**
 * @route   POST /api/providers/:providerId/reject
 * @desc    Rechazar un proveedor
 * @access  Admin
 */
router.post('/:providerId/reject', (req: Request, res: Response) => {
  providerController.rejectProvider(req, res);
});

/**
 * @route   POST /api/providers/:providerId/documents
 * @desc    Subir documentos de verificación
 * @access  Private (Provider)
 */
router.post(
  '/:providerId/documents',
  (req: Request, res: Response, next: NextFunction) => providerMiddleware.isProviderOrAdmin(req as AuthRequest, res, next),
  (req: Request, res: Response) => {
    providerController.uploadDocument(req, res);
  }
);

/**
 * @route   GET /api/providers/:providerId/documents
 * @desc    Obtener documentos de un proveedor
 * @access  Private (Provider/Admin)
 */
router.get(
  '/:providerId/documents',
  (req: Request, res: Response, next: NextFunction) => providerMiddleware.isProviderOrAdmin(req as AuthRequest, res, next),
  (req: Request, res: Response) => {
    providerController.getProviderDocuments(req, res);
  }
);

/**
 * @route   POST /api/providers/:providerId/documents/:documentId/verify
 * @desc    Verificar un documento (admin)
 * @access  Admin
 */
router.post(
  '/:providerId/documents/:documentId/verify',
  (req: Request, res: Response) => {
    providerController.verifyDocument(req, res);
  }
);

export default router;