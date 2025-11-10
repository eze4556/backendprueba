"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_models_1 = __importDefault(require("../models/user.models"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const password_recovery_service_1 = __importDefault(require("../services/password-recovery.service"));
// Controlador para operaciones relacionadas con contraseñas
class PasswordController {
    /**
     * Cambia la contraseña de un usuario
     * @param req Petición HTTP con los datos necesarios
     * @param res Respuesta HTTP
     * @returns Respuesta con el resultado de la operación
     */
    async changePassword(req, res) {
        try {
            // Extrae el id y la nueva contraseña del request
            const { _id, password } = req;
            // Actualiza la contraseña en la base de datos
            await user_models_1.default.findByIdAndUpdate({ _id }, { $set: { 'auth_data.password': password } });
            // Devuelve respuesta de éxito
            return handler_helper_1.default.success(res, {
                message: 'Password reset successfully',
                _id
            });
        }
        catch (e) {
            // Maneja errores internos
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: e.message
            });
        }
    }
    /**
     * Solicitar recuperación de contraseña
     * POST /api/password/forgot
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'El email es requerido'
                });
            }
            const result = await password_recovery_service_1.default.requestPasswordReset(email);
            return handler_helper_1.default.success(res, result);
        }
        catch (error) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message
            });
        }
    }
    /**
     * Validar token de reset
     * GET /api/password/validate/:token
     */
    async validateToken(req, res) {
        try {
            const { token } = req.params;
            if (!token) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'El token es requerido'
                });
            }
            const result = await password_recovery_service_1.default.validateResetToken(token);
            if (!result.valid) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: result.message
                });
            }
            return handler_helper_1.default.success(res, {
                valid: true,
                message: result.message
            });
        }
        catch (error) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message
            });
        }
    }
    /**
     * Resetear contraseña con token
     * POST /api/password/reset/:token
     */
    async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { password, confirmPassword } = req.body;
            if (!token || !password || !confirmPassword) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Token, contraseña y confirmación son requeridos'
                });
            }
            if (password !== confirmPassword) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: 'Las contraseñas no coinciden'
                });
            }
            const result = await password_recovery_service_1.default.resetPassword(token, password);
            if (!result.success) {
                return handler_helper_1.default.error(res, {
                    code: codes_constanst_1.BAD_REQUEST,
                    message: result.message
                });
            }
            return handler_helper_1.default.success(res, {
                message: 'Contraseña actualizada exitosamente'
            });
        }
        catch (error) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: error.message
            });
        }
    }
}
exports.default = new PasswordController();
//# sourceMappingURL=password.controllers.js.map