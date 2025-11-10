"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_service_1 = __importDefault(require("../app/users/services/token.service"));
const handler_helper_1 = __importDefault(require("../helpers/handler.helper"));
const codes_constanst_1 = require("../constants/codes.constanst");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar access token usando refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'Refresh token es requerido'
            });
        }
        const result = await token_service_1.default.refreshAccessToken(refreshToken);
        if (!result.success) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: result.message
            });
        }
        return handler_helper_1.default.success(res, {
            accessToken: result.accessToken,
            message: result.message
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   POST /api/auth/logout
 * @desc    Invalidar refresh token (logout)
 * @access  Public
 */
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return handler_helper_1.default.success(res, {
                message: 'Logout exitoso'
            });
        }
        const revoked = await token_service_1.default.revokeRefreshToken(refreshToken);
        return handler_helper_1.default.success(res, {
            message: revoked ? 'Logout exitoso' : 'Token ya estaba invalidado'
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
/**
 * @route   POST /api/auth/logout-all
 * @desc    Invalidar todos los refresh tokens de un usuario
 * @access  Private (requiere userId en body o token)
 */
router.post('/logout-all', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'userId es requerido'
            });
        }
        await token_service_1.default.revokeAllUserTokens(userId);
        return handler_helper_1.default.success(res, {
            message: 'Logout de todos los dispositivos exitoso'
        });
    }
    catch (error) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=token.routes.js.map