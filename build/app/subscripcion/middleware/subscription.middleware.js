"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionMiddleware = void 0;
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const subscription_service_1 = require("../service/subscription.service");
class SubscriptionMiddleware {
    constructor() {
        /**
         * Verifica si el usuario es el propietario de la suscripción
         */
        this.isSubscriptionOwner = async (req, res, next) => {
            var _a, _b;
            try {
                const subscriptionId = req.params.subscriptionId || req.body.subscriptionId;
                if (!subscriptionId) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'ID de suscripción requerido'
                    });
                }
                // Si el usuario es admin, permitimos acceso
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
                    return next();
                }
                // Obtenemos la suscripción y verificamos si el usuario es el propietario
                const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
                if (!subscription) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'Suscripción no encontrada'
                    });
                }
                if (subscription.providerId !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id)) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.FORBIDDEN,
                        message: 'No tiene permisos para acceder a esta suscripción'
                    });
                }
                next();
            }
            catch (error) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.INTERNAL_ERROR,
                    message: error.message
                });
            }
        };
        /**
         * Verifica si hay cupo disponible en la suscripción
         */
        this.hasMemberSlot = async (req, res, next) => {
            try {
                const { subscriptionId } = req.body;
                if (!subscriptionId) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'ID de suscripción requerido'
                    });
                }
                const subscription = await this.subscriptionService.getSubscriptionById(subscriptionId);
                if (!subscription) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'Suscripción no encontrada'
                    });
                }
                const canAddMember = this.subscriptionService.canAddMembers(subscription);
                if (!canAddMember) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'No hay cupos disponibles en el plan actual'
                    });
                }
                next();
            }
            catch (error) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.INTERNAL_ERROR,
                    message: error.message
                });
            }
        };
        /**
         * Verifica si el usuario es miembro de la suscripción
         */
        this.isMember = async (req, res, next) => {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'Usuario no identificado'
                    });
                }
                // Método a implementar en el servicio de suscripciones
                const isMember = await this.subscriptionService.isUserMember(userId);
                if (!isMember) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.FORBIDDEN,
                        message: 'El usuario no pertenece a ninguna suscripción activa'
                    });
                }
                next();
            }
            catch (error) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.INTERNAL_ERROR,
                    message: error.message
                });
            }
        };
        this.subscriptionService = new subscription_service_1.SubscriptionService();
    }
}
exports.SubscriptionMiddleware = SubscriptionMiddleware;
// Crear y exportar una instancia
const subscriptionMiddleware = new SubscriptionMiddleware();
exports.default = subscriptionMiddleware;
//# sourceMappingURL=subscription.middleware.js.map