"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const provider_service_1 = __importDefault(require("../servicio/provider.service"));
class ProviderMiddleware {
    constructor() {
        this.providerService = provider_service_1.default;
        /**
         * Verifica si el usuario es dueño del proveedor o es un administrador
         */
        this.isProviderOrAdmin = (req, res, next) => {
            var _a, _b;
            try {
                const providerId = req.params.providerId || req.body.providerId;
                if (!providerId) {
                    return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                        message: 'Bad request error',
                        data: { error: 'ID de proveedor requerido' }
                    });
                }
                // Si el usuario es admin, permitimos acceso
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === 'admin') {
                    return next();
                }
                // Si el providerId del token coincide con el providerId de la solicitud
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.providerId) === providerId) {
                    return next();
                }
                return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                    message: 'Forbidden',
                    data: { error: 'No tiene permisos para realizar esta acción' }
                });
            }
            catch (error) {
                return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                    message: 'Internal Error',
                    data: { error: error.message }
                });
            }
        };
        /**
         * Verifica si el proveedor está aprobado
         */
        this.isProviderApproved = async (req, res, next) => {
            var _a, _b;
            try {
                const providerId = req.params.providerId || req.body.providerId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a.providerId);
                if (!providerId) {
                    return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                        message: 'Bad request error',
                        data: { error: 'ID de proveedor requerido' }
                    });
                }
                const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
                if (!organizationId) {
                    return handler_helper_1.default.response(res, codes_constanst_1.BAD_REQUEST, {
                        message: 'Bad request error',
                        data: { error: 'ID de organización requerido' }
                    });
                }
                const isApproved = await this.providerService.isProviderApproved(providerId, organizationId);
                if (!isApproved) {
                    return handler_helper_1.default.response(res, codes_constanst_1.FORBIDDEN, {
                        message: 'Forbidden',
                        data: { error: 'El proveedor no está aprobado o no existe' }
                    });
                }
                return next();
            }
            catch (error) {
                return handler_helper_1.default.response(res, codes_constanst_1.INTERNAL_ERROR, {
                    message: 'Internal Error',
                    data: { error: error.message }
                });
            }
        };
    }
}
exports.default = new ProviderMiddleware();
