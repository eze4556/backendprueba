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
            try {
                const providerId = req.params.providerId || req.body.providerId;
                if (!providerId) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'ID de proveedor requerido'
                    });
                }
                // Si el usuario es admin, permitimos acceso
                const user = req.user;
                if ((user === null || user === void 0 ? void 0 : user.role) === 'admin') {
                    return next();
                }
                if ((user === null || user === void 0 ? void 0 : user.providerId) === providerId) {
                    return next();
                }
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.FORBIDDEN,
                    message: 'No tiene permisos para realizar esta acción'
                });
            }
            catch (error) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.INTERNAL_ERROR,
                    message: error.message
                });
            }
        };
        /**
         * Verifica si el proveedor está aprobado
         */
        this.isProviderApproved = async (req, res, next) => {
            try {
                const user = req.user;
                const providerId = req.params.providerId || req.body.providerId || (user === null || user === void 0 ? void 0 : user.providerId);
                if (!providerId) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'ID de proveedor requerido'
                    });
                }
                const organizationId = user === null || user === void 0 ? void 0 : user.organizationId;
                if (!organizationId) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.BAD_REQUEST,
                        message: 'ID de organización requerido'
                    });
                }
                const isApproved = await this.providerService.isProviderApproved(providerId, organizationId);
                if (!isApproved) {
                    return handler_helper_1.default.error(res, {
                        code: codes_constanst_1.FORBIDDEN,
                        message: 'El proveedor no está aprobado o no existe'
                    });
                }
                return next();
            }
            catch (error) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.INTERNAL_ERROR,
                    message: error.message
                });
            }
        };
    }
}
exports.default = new ProviderMiddleware();
//# sourceMappingURL=provider.middleware.js.map