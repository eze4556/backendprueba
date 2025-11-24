"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ts_dotenv_1 = require("ts-dotenv");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env = (0, ts_dotenv_1.load)({
    JWT_KEY: String,
    JWT_EXPIRES_IN: String,
});
class AuthService {
    constructor() {
        this.jwtKey = env.JWT_KEY;
        this.jwtExpiresIn = env.JWT_EXPIRES_IN || '24h';
    }
    /**
     * Genera un token JWT
     * @param payload Datos a incluir en el token
     */
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.jwtKey, { expiresIn: this.jwtExpiresIn });
    }
    /**
     * Verifica y decodifica un token JWT
     * @param token Token a verificar
     */
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtKey);
            // Verificar que sea un objeto y no un string
            if (typeof decoded === 'string') {
                throw new Error('Token format is invalid');
            }
            // Verificar que tenga las propiedades requeridas de TokenPayload
            if (!decoded.userId || !decoded.roles) {
                throw new Error('Token payload is incomplete');
            }
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    /**
     * Extrae el token de los headers de la request
     * @param req Express Request
     */
    extractTokenFromRequest(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return null;
        const [bearer, token] = authHeader.split(' ');
        return bearer === 'Bearer' ? token : null;
    }
    /**
     * Hashea una contraseña
     * @param password Contraseña a hashear
     */
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    /**
     * Compara una contraseña con su hash
     * @param password Contraseña a verificar
     * @param hash Hash almacenado
     */
    async comparePasswords(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map