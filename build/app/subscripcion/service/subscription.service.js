"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const suscription_model_1 = require("../models/suscription.model");
const payment_service_1 = require("../service/payment.service");
class SubscriptionService {
    constructor() {
        this.paymentService = new payment_service_1.PaymentService();
    }
    /**
     * Obtiene detalles del plan según su tipo
     */
    getPlanDetails(planType) {
        const plans = {
            [suscription_model_1.PlanType.BASE]: { price: 29.99, maxUsers: 5 },
            [suscription_model_1.PlanType.PREMIUM]: { price: 49.99, maxUsers: 15 },
            [suscription_model_1.PlanType.ENTERPRISE]: { price: 99.99, maxUsers: 50 }
        };
        return plans[planType] || plans[suscription_model_1.PlanType.BASE];
    }
    /**
     * Obtiene una suscripción por su ID
     */
    async getSubscriptionById(subscriptionId) {
        try {
            // Aquí iría la consulta a la base de datos
            // Por ahora, implementamos una simulación básica
            // Simulación de una suscripción para desarrollo
            if (subscriptionId.startsWith('sub_')) {
                return {
                    id: subscriptionId,
                    providerId: 'provider_123',
                    planType: suscription_model_1.PlanType.BASE,
                    startDate: new Date(),
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                    isActive: true,
                    paymentMethod: 'card',
                    paymentId: 'payment_123',
                    totalMembers: 2,
                    members: []
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error al obtener suscripción:', error);
            throw error;
        }
    }
    /**
     * Renueva una suscripción
     */
    async renewSubscription(providerId, subscriptionId, paymentMethod, paymentData) {
        // Obtener la suscripción actual
        const subscription = await this.getSubscriptionById(subscriptionId);
        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }
        if (subscription.providerId !== providerId) {
            throw new Error('No tiene permiso para gestionar esta suscripción');
        }
        // Obtener detalles del plan
        const plan = this.getPlanDetails(subscription.planType);
        // Procesar el pago
        const paymentResult = await this.paymentService.authorizePayment(paymentMethod, paymentData, plan.price);
        // Actualizar fechas de la suscripción
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        subscription.startDate = startDate;
        subscription.endDate = endDate;
        subscription.isActive = true;
        subscription.paymentMethod = paymentMethod;
        subscription.paymentId = paymentResult.id;
        // Aquí iría el código para actualizar la suscripción en la base de datos
        return subscription;
    }
    /**
     * Método auxiliar para obtener todas las suscripciones (simulación)
     */
    async getAllSubscriptions() {
        // Aquí iría la consulta real a la base de datos
        return [];
    }
    /**
     * Busca un miembro por su ID
     */
    async findMember(memberId) {
        // Aquí iría la búsqueda real en la base de datos
        // Por ahora implementamos una búsqueda en todas las suscripciones
        try {
            // Obtener todas las suscripciones (simulación)
            const subscriptions = await this.getAllSubscriptions();
            for (const subscription of subscriptions) {
                const member = subscription.members.find(m => m.id === memberId);
                if (member) {
                    return { subscription, member };
                }
            }
            return { subscription: {}, member: null };
        }
        catch (error) {
            console.error('Error al buscar miembro:', error);
            throw error;
        }
    }
    /**
     * Obtiene detalles completos de una suscripción
     */
    async getSubscriptionDetails(providerId, subscriptionId) {
        const subscription = await this.getSubscriptionById(subscriptionId);
        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }
        if (subscription.providerId !== providerId) {
            throw new Error('No tiene permiso para gestionar esta suscripción');
        }
        // Si necesitamos información adicional la podríamos agregar aquí
        // Por ejemplo, detalles del plan, información de miembros, etc.
        return subscription;
    }
    /**
     * Obtiene todas las suscripciones de un proveedor
     */
    async getProviderSubscriptions(providerId) {
        try {
            // Aquí iría la consulta a la base de datos
            // Simulación temporal con datos de prueba
            return [
                {
                    id: 'sub_' + Math.random().toString(36).substring(2, 15),
                    providerId,
                    planType: suscription_model_1.PlanType.BASE,
                    startDate: new Date(),
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                    isActive: true,
                    paymentMethod: 'card',
                    paymentId: 'payment_123',
                    totalMembers: 2,
                    members: []
                }
            ];
        }
        catch (error) {
            console.error('Error al obtener suscripciones del proveedor:', error);
            throw error;
        }
    }
    /**
     * Obtiene las invitaciones pendientes para un usuario por email
     */
    async getUserInvitations(email) {
        try {
            // Aquí iría la consulta a la base de datos
            // Simulación temporal con datos de prueba
            return [
                {
                    id: 'member_' + Math.random().toString(36).substring(2, 15),
                    subscriptionId: 'sub_123',
                    email,
                    name: 'Usuario Invitado',
                    userType: suscription_model_1.UserType.FREELANCE,
                    status: suscription_model_1.MemberStatus.INVITED,
                    invitedAt: new Date()
                }
            ];
        }
        catch (error) {
            console.error('Error al obtener invitaciones:', error);
            throw error;
        }
    }
    /**
     * Verifica si se pueden agregar más miembros a la suscripción
     */
    canAddMembers(subscription) {
        if (!subscription || !subscription.isActive) {
            return false;
        }
        const planDetails = this.getPlanDetails(subscription.planType);
        return subscription.totalMembers < planDetails.maxUsers;
    }
    /**
     * Obtiene la suscripción activa de un usuario
     */
    async getUserActiveSubscription(userId) {
        try {
            // Aquí iría la consulta a la base de datos
            // Buscar en todas las suscripciones donde el usuario es miembro activo
            // Simulación temporal con datos de prueba
            if (userId) {
                return {
                    id: 'sub_' + Math.random().toString(36).substring(2, 15),
                    providerId: 'provider_123',
                    planType: suscription_model_1.PlanType.BASE,
                    startDate: new Date(),
                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                    isActive: true,
                    paymentMethod: 'card',
                    paymentId: 'payment_123',
                    totalMembers: 2,
                    members: [
                        {
                            id: 'member_' + Math.random().toString(36).substring(2, 15),
                            subscriptionId: 'sub_123',
                            userId: userId,
                            email: 'usuario@ejemplo.com',
                            name: 'Usuario Activo',
                            userType: suscription_model_1.UserType.FREELANCE,
                            status: suscription_model_1.MemberStatus.ACTIVE,
                            invitedAt: new Date(),
                            activatedAt: new Date()
                        }
                    ]
                };
            }
            return null;
        }
        catch (error) {
            console.error('Error al obtener suscripción activa:', error);
            throw error;
        }
    }
}
exports.SubscriptionService = SubscriptionService;
//# sourceMappingURL=subscription.service.js.map