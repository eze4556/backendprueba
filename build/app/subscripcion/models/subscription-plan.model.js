"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_PLANS = exports.UserType = exports.PlanType = void 0;
var PlanType;
(function (PlanType) {
    PlanType["BASE"] = "base";
    PlanType["INTERMEDIATE"] = "intermediate";
    PlanType["GOLD"] = "gold";
})(PlanType || (exports.PlanType = PlanType = {}));
var UserType;
(function (UserType) {
    UserType["AUTONOMOUS"] = "autonomous";
    UserType["DEDICATED"] = "dedicated";
    UserType["PROFESSIONAL"] = "profesional";
})(UserType || (exports.UserType = UserType = {}));
// Planes predefinidos
exports.SUBSCRIPTION_PLANS = {
    [PlanType.BASE]: {
        id: 'plan_base',
        type: PlanType.BASE,
        name: 'Plan Base',
        maxUsers: 5,
        price: 9.99,
        description: 'Plan básico para equipos pequeños',
        features: [
            'Acceso básico',
            'Soporte por email',
            'Máximo 5 usuarios'
        ],
    },
    [PlanType.INTERMEDIATE]: {
        id: 'plan_intermediate',
        type: PlanType.INTERMEDIATE,
        name: 'Plan Intermedio',
        maxUsers: 15,
        price: 19.99,
        description: 'Plan ideal para equipos en crecimiento',
        features: [
            'Todas las características del plan base',
            'Soporte prioritario',
            'Máximo 15 usuarios',
            'Funcionalidades avanzadas'
        ],
    },
    [PlanType.GOLD]: {
        id: 'plan_gold',
        type: PlanType.GOLD,
        name: 'Plan Gold',
        maxUsers: 30,
        price: 39.99,
        description: 'Solución completa para empresas grandes',
        features: [
            'Todas las características del plan intermedio',
            'Soporte 24/7',
            'Máximo 30 usuarios',
            'Funcionalidades premium',
            'Acceso a API avanzada'
        ],
    }
};
//# sourceMappingURL=subscription-plan.model.js.map