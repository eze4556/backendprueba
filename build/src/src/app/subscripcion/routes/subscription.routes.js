"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = __importDefault(require("../controller/subscription.controller"));
const providerauth_middleware_1 = __importDefault(require("../../proveedores/middleware/providerauth.middleware"));
const router = (0, express_1.Router)();
const subscriptionController = new subscription_controller_1.default();
const isSubscriptionOwnerMiddleware = (req, res, next) => {
    var _a, _b;
    const providerId = req.params.providerId || req.body.providerId;
    if (!req.user) {
        return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
    }
    // Check if user is a provider and if the providerId matches the user's ID
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'provider' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) === providerId) {
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
router.post('/provider/subscribe', providerauth_middleware_1.default, subscriptionController.subscribeProvider);
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
router.post('/change-plan', providerauth_middleware_1.default, subscriptionController.changePlan);
/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancelar una suscripción
 * @access  Private (Provider)
 */
router.post('/cancel', providerauth_middleware_1.default, subscriptionController.cancelSubscription);
/**
 * @route   POST /api/subscriptions/renew
 * @desc    Renovar una suscripción
 * @access  Private (Provider)
 */
router.post('/renew', providerauth_middleware_1.default, subscriptionController.renewSubscription);
// ============================================
// GESTIÓN DE MIEMBROS
// ============================================
/**
 * @route   POST /api/subscriptions/members/invite
 * @desc    Invitar a un usuario al plan
 * @access  Private (Provider)
 */
router.post('/members/invite', providerauth_middleware_1.default, subscriptionController.inviteMember);
/**
 * @route   POST /api/subscriptions/members/activate/:memberId
 * @desc    Activar un miembro (aceptar invitación)
 * @access  Private (User)
 */
router.post('/members/activate/:memberId', subscriptionController.activateMember);
/**
 * @route   POST /api/subscriptions/members/deactivate/:memberId
 * @desc    Desactivar un miembro
 * @access  Private (Provider)
 */
router.post('/members/deactivate/:memberId', providerauth_middleware_1.default, subscriptionController.deactivateMember);
/**
 * @route   POST /api/subscriptions/members/change-type/:memberId
 * @desc    Cambiar el tipo de usuario (autónomo/dedicado)
 * @access  Private (Provider)
 */
router.post('/members/change-type/:memberId', providerauth_middleware_1.default, subscriptionController.changeUserType);
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
router.get('/user/active', (req, res) => {
    subscriptionController.getUserActiveSubscription(req, res);
});
exports.default = router;
