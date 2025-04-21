import { Router, Request, Response, NextFunction } from 'express';
import SubscriptionController from '../controller/subscription.controller';
import { authMiddleware, AuthRequest } from '../../../middleware/auth.middleware';
import providerAuthMiddleware from '../../proveedores/middleware/providerauth.middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                isProvider: boolean;
                email?: string;
                role?: string;
            }
        }
    }
}

const isSubscriptionOwnerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const providerId: string | undefined = req.params.providerId || req.body.providerId;

    if (!req.user) {
        return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
    }

    // Check if user is a provider and if the providerId matches the user's ID
    if ((req as AuthRequest).user?.role === 'provider' && (req as AuthRequest).user?.id === providerId) {
        return next();
    }

    return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
};

// ============================================
// PLANES
// ============================================

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Obtener todos los planes disponibles
 * @access  Public
 */
router.get('/plans', subscriptionController.getAllPlans);

/**
 * @route   GET /api/subscriptions/plans/:planType
 * @desc    Obtener detalles de un plan específico
 * @access  Public
 */
router.get('/plans/:planType', subscriptionController.getPlanDetails);

// ============================================
// SUSCRIPCIONES DE PROVEEDORES
// ============================================

/**
 * @route   POST /api/subscriptions/provider/subscribe
 * @desc    Suscribir a un proveedor a un plan
 * @access  Private (Provider)
 */
router.post('/provider/subscribe', providerAuthMiddleware, subscriptionController.subscribeProvider);

/**
 * @route   GET /api/subscriptions/provider/:providerId
 * @desc    Obtener suscripciones de un proveedor
 * @access  Private (Provider)
 */
router.get('/provider/:providerId', isSubscriptionOwnerMiddleware, subscriptionController.getProviderSubscriptions);

/**
 * @route   GET /api/subscriptions/:subscriptionId
 * @desc    Obtener detalles de una suscripción
 * @access  Private (Provider)
 */
router.get('/:subscriptionId', isSubscriptionOwnerMiddleware, subscriptionController.getSubscriptionDetails);

/**
 * @route   POST /api/subscriptions/change-plan
 * @desc    Cambiar el plan de una suscripción
 * @access  Private (Provider)
 */
router.post('/change-plan', providerAuthMiddleware, subscriptionController.changePlan);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancelar una suscripción
 * @access  Private (Provider)
 */
router.post('/cancel', providerAuthMiddleware, subscriptionController.cancelSubscription);

/**
 * @route   POST /api/subscriptions/renew
 * @desc    Renovar una suscripción
 * @access  Private (Provider)
 */
router.post('/renew', providerAuthMiddleware, subscriptionController.renewSubscription);

// ============================================
// GESTIÓN DE MIEMBROS
// ============================================

/**
 * @route   POST /api/subscriptions/members/invite
 * @desc    Invitar a un usuario al plan
 * @access  Private (Provider)
 */
router.post('/members/invite', providerAuthMiddleware, subscriptionController.inviteMember);

/**
 * @route   POST /api/subscriptions/members/activate/:memberId
 * @desc    Activar un miembro (aceptar invitación)
 * @access  Private (User)
 */
router.post('/members/activate/:memberId',subscriptionController.activateMember);

/**
 * @route   POST /api/subscriptions/members/deactivate/:memberId
 * @desc    Desactivar un miembro
 * @access  Private (Provider)
 */
router.post('/members/deactivate/:memberId', providerAuthMiddleware, subscriptionController.deactivateMember);

/**
 * @route   POST /api/subscriptions/members/change-type/:memberId
 * @desc    Cambiar el tipo de usuario (autónomo/dedicado)
 * @access  Private (Provider)
 */
router.post('/members/change-type/:memberId', providerAuthMiddleware, subscriptionController.changeUserType);

/**
 * @route   GET /api/subscriptions/members/:subscriptionId
 * @desc    Obtener miembros de una suscripción
 * @access  Private (Provider)
 */
router.get('/members/:subscriptionId', isSubscriptionOwnerMiddleware, subscriptionController.getSubscriptionMembers);

/**
 * @route   GET /api/subscriptions/members/invitations
 * @desc    Obtener invitaciones pendientes para un usuario
 * @access  Private (User)
 */
router.get('/members/invitations', subscriptionController.getUserInvitations);

/**
 * @route   GET /api/subscriptions/user/active
 * @desc    Obtener la suscripción activa del usuario
 * @access  Private (User)
 */
router.get('/user/active', (req: Request, res: Response) => {
    subscriptionController.getUserActiveSubscription(req, res);
});

export default router;