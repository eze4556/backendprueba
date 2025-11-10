"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const refresh_token_models_1 = __importDefault(require("../models/refresh-token.models"));
const ts_dotenv_1 = require("ts-dotenv");
const env = (0, ts_dotenv_1.load)({
    JWT_KEY: String,
    JWT_REFRESH_SECRET: {
        type: String,
        optional: true
    }
});
const JWT_SECRET = env.JWT_KEY;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || env.JWT_KEY + '_refresh';
class TokenService {
    /**
     * Generar access token (JWT)
     */
    generateAccessToken(userId, email, role) {
        return jsonwebtoken_1.default.sign({
            userId,
            email,
            role: role || 'user'
        }, JWT_SECRET, { expiresIn: '24h' } // 24 horas
        );
    }
    /**
     * Generar refresh token
     */
    async generateRefreshToken(userId, ip, userAgent) {
        const token = (0, crypto_1.randomUUID)();
        // Expiración de 7 días
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await refresh_token_models_1.default.create({
            userId,
            token,
            expiresAt,
            ip,
            userAgent
        });
        return token;
    }
    /**
     * Validar y renovar access token usando refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Buscar refresh token en BD
            const tokenRecord = await refresh_token_models_1.default.findOne({ token: refreshToken })
                .populate('userId');
            if (!tokenRecord) {
                return {
                    success: false,
                    message: 'Refresh token inválido'
                };
            }
            // Verificar expiración
            if (new Date() > tokenRecord.expiresAt) {
                // Eliminar token expirado
                await refresh_token_models_1.default.deleteOne({ token: refreshToken });
                return {
                    success: false,
                    message: 'Refresh token expirado'
                };
            }
            // Obtener datos del usuario
            const user = tokenRecord.userId;
            // Generar nuevo access token
            const newAccessToken = this.generateAccessToken(user._id.toString(), user.primary_data.email, user.primary_data.type);
            return {
                success: true,
                accessToken: newAccessToken,
                message: 'Token renovado exitosamente'
            };
        }
        catch (error) {
            console.error('Error en refreshAccessToken:', error);
            return {
                success: false,
                message: 'Error al renovar token'
            };
        }
    }
    /**
     * Invalidar refresh token (logout)
     */
    async revokeRefreshToken(refreshToken) {
        try {
            const result = await refresh_token_models_1.default.deleteOne({ token: refreshToken });
            return result.deletedCount > 0;
        }
        catch (error) {
            console.error('Error al revocar refresh token:', error);
            return false;
        }
    }
    /**
     * Invalidar todos los refresh tokens de un usuario (logout de todos los dispositivos)
     */
    async revokeAllUserTokens(userId) {
        try {
            await refresh_token_models_1.default.deleteMany({ userId });
            return true;
        }
        catch (error) {
            console.error('Error al revocar tokens del usuario:', error);
            return false;
        }
    }
    /**
     * Verificar access token
     */
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return {
                valid: true,
                decoded,
                message: 'Token válido'
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return {
                    valid: false,
                    message: 'Token expirado'
                };
            }
            return {
                valid: false,
                message: 'Token inválido'
            };
        }
    }
}
exports.default = new TokenService();
//# sourceMappingURL=token.service.js.map