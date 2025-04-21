"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscription_service_1 = require("../service/subscription.service");
const suscription_model_1 = require("../models/suscription.model");
class SubscriptionController {
    constructor() {
        // ============================================
        // PLANES
        // ============================================
        this.getAllPlans = async (req, res) => {
            try {
                const plans = await Promise.all(Object.values(suscription_model_1.PlanType).map(planType => this.subscriptionService.getPlanDetails(planType)));
                return res.json(plans);
            }
            catch (error) {
                console.error("Error in getAllPlans:", error);
                return res.status(500).json({ error: 'Failed to retrieve all plans' });
            }
        };
        this.getPlanDetails = async (req, res) => {
            try {
                const planType = req.params.planType;
                if (!Object.values(suscription_model_1.PlanType).includes(planType)) {
                    return res.status(400).json({ error: 'Tipo de plan no válido' });
                }
                const plan = await this.subscriptionService.getPlanDetails(planType);
                return res.json(plan);
            }
            catch (error) {
                console.error("Error in getPlanDetails:", error);
                return res.status(500).json({ error: 'Failed to retrieve plan details' });
            }
        };
        // ============================================
        // SUSCRIPCIONES DE PROVEEDORES
        // ============================================
        this.subscribeProvider = async (req, res) => {
            try {
                const { providerId, planType, paymentMethod, paymentData } = req.body;
                if (!providerId || !planType || !paymentMethod || !paymentData) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const subscription = await this.subscriptionService.subscribeProvider(providerId, planType, paymentMethod, paymentData);
                return res.status(201).json(subscription);
            }
            catch (error) {
                console.error("Error in subscribeProvider:", error);
                return res.status(500).json({ error: 'Failed to subscribe provider' });
            }
        };
        this.getProviderSubscriptions = async (req, res) => {
            try {
                const { providerId } = req.params;
                if (!providerId) {
                    return res.status(400).json({ error: 'ID de proveedor requerido' });
                }
                const subscriptions = await this.subscriptionService.getProviderSubscriptions(providerId);
                return res.json(subscriptions);
            }
            catch (error) {
                console.error("Error in getProviderSubscriptions:", error);
                return res.status(500).json({ error: 'Failed to retrieve provider subscriptions' });
            }
        };
        this.getSubscriptionDetails = async (req, res) => {
            try {
                const { subscriptionId } = req.params;
                const { providerId } = req.query;
                if (!subscriptionId || !providerId) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const subscription = await this.subscriptionService.getSubscriptionDetails(providerId, subscriptionId);
                return res.json(subscription);
            }
            catch (error) {
                console.error("Error in getSubscriptionDetails:", error);
                return res.status(500).json({ error: 'Failed to retrieve subscription details' });
            }
        };
        this.changePlan = async (req, res) => {
            try {
                const { providerId, subscriptionId, newPlanType, paymentMethod, paymentData } = req.body;
                if (!providerId || !subscriptionId || !newPlanType || !paymentMethod || !paymentData) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const updatedSubscription = await this.subscriptionService.changePlan(providerId, subscriptionId, newPlanType, paymentMethod, paymentData);
                return res.json(updatedSubscription);
            }
            catch (error) {
                console.error("Error in changePlan:", error);
                return res.status(500).json({ error: 'Failed to change plan' });
            }
        };
        this.cancelSubscription = async (req, res) => {
            try {
                const { providerId, subscriptionId } = req.body;
                if (!providerId || !subscriptionId) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const result = await this.subscriptionService.cancelSubscription(providerId, subscriptionId);
                return res.json({ success: result, message: 'Suscripción cancelada correctamente' });
            }
            catch (error) {
                console.error("Error in cancelSubscription:", error);
                return res.status(500).json({ error: 'Failed to cancel subscription' });
            }
        };
        this.renewSubscription = async (req, res) => {
            try {
                const { providerId, subscriptionId, paymentMethod, paymentData } = req.body;
                if (!providerId || !subscriptionId || !paymentMethod || !paymentData) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const renewedSubscription = await this.subscriptionService.renewSubscription(providerId, subscriptionId, paymentMethod, paymentData);
                return res.json(renewedSubscription);
            }
            catch (error) {
                console.error("Error in renewSubscription:", error);
                return res.status(500).json({ error: 'Failed to renew subscription' });
            }
        };
        // ============================================
        // GESTIÓN DE MIEMBROS
        // ============================================
        this.inviteMember = async (req, res) => {
            try {
                const { providerId, subscriptionId, email, name, userType } = req.body;
                if (!providerId || !subscriptionId || !email || !name || !userType) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                if (!Object.values(suscription_model_1.UserType).includes(userType)) {
                    return res.status(400).json({ error: 'Tipo de usuario no válido' });
                }
                const member = await this.subscriptionService.inviteMember(subscriptionId, providerId, email, name, userType);
                return res.status(201).json(member);
            }
            catch (error) {
                console.error("Error in inviteMember:", error);
                return res.status(500).json({ error: 'Failed to invite member' });
            }
        };
        this.activateMember = async (req, res) => {
            try {
                const { memberId } = req.params;
                const { userId } = req.body;
                if (!memberId || !userId) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const member = await this.subscriptionService.activateMember(memberId, userId);
                return res.json(member);
            }
            catch (error) {
                console.error("Error in activateMember:", error);
                return res.status(500).json({ error: 'Failed to activate member' });
            }
        };
        this.deactivateMember = async (req, res) => {
            try {
                const { memberId } = req.params;
                const { providerId } = req.body;
                if (!memberId || !providerId) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const member = await this.subscriptionService.deactivateMember(providerId, memberId);
                return res.json(member);
            }
            catch (error) {
                console.error("Error in deactivateMember:", error);
                return res.status(500).json({ error: 'Failed to deactivate member' });
            }
        };
        this.changeUserType = async (req, res) => {
            try {
                const { memberId } = req.params;
                const { providerId, userType } = req.body;
                if (!memberId || !providerId || !userType) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                if (!Object.values(suscription_model_1.UserType).includes(userType)) {
                    return res.status(400).json({ error: 'Tipo de usuario no válido' });
                }
                const member = await this.subscriptionService.changeUserType(providerId, memberId, userType);
                return res.json(member);
            }
            catch (error) {
                console.error("Error in changeUserType:", error);
                return res.status(500).json({ error: 'Failed to change user type' });
            }
        };
        this.getSubscriptionMembers = async (req, res) => {
            try {
                const { subscriptionId } = req.params;
                const { providerId } = req.query;
                if (!subscriptionId || !providerId) {
                    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
                }
                const members = await this.subscriptionService.getSubscriptionMembers(providerId, subscriptionId);
                return res.json(members);
            }
            catch (error) {
                console.error("Error in getSubscriptionMembers:", error);
                return res.status(500).json({ error: 'Failed to retrieve subscription members' });
            }
        };
        this.getUserInvitations = async (req, res) => {
            var _a, _b;
            try {
                // Check if req.user is defined and has the necessary properties
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const email = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
                if (!userId || !email) {
                    console.warn("User ID or email not found in request.user. Ensure auth middleware is correctly populating req.user.");
                    return res.status(401).json({ error: 'Usuario no autenticado' });
                }
                const invitations = await this.subscriptionService.getUserInvitations(email);
                return res.json(invitations);
            }
            catch (error) {
                console.error("Error in getUserInvitations:", error);
                return res.status(500).json({ error: 'Failed to retrieve user invitations' });
            }
        };
        this.getUserActiveSubscription = async (req, res) => {
            var _a;
            try {
                // Check if req.user is defined and has the necessary properties
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    console.warn("User ID not found in request.user. Ensure auth middleware is correctly populating req.user.");
                    return res.status(401).json({ error: 'Usuario no autenticado' });
                }
                const subscription = await this.subscriptionService.getUserActiveSubscription(userId);
                return res.json(subscription);
            }
            catch (error) {
                console.error("Error in getUserActiveSubscription:", error);
                return res.status(500).json({ error: 'Failed to retrieve user active subscription' });
            }
        };
        this.subscriptionService = new subscription_service_1.SubscriptionService();
    }
}
exports.default = SubscriptionController;
