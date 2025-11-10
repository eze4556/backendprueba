"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = __importStar(require("jsonwebtoken"));
const ts_dotenv_1 = require("ts-dotenv");
const handler_helper_1 = __importDefault(require("../../helpers/handler.helper"));
const codes_constanst_1 = require("../../constants/codes.constanst");
const env = (0, ts_dotenv_1.load)({
    JWT_KEY: String,
});
class Token {
    /**
     * Verify token and next()
     * @param req
     * @param res
     * @param next
     * @returns
     */
    static async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader) {
                return res.status(403).json({
                    response: {
                        message: 'Forbidden',
                        data: 'Access forbidden'
                    }
                });
            }
            const token = authHeader.split(' ')[1]; // Asegúrate de que el token esté en el formato "Bearer <token>"
            if (!token) {
                return res.status(403).json({
                    response: {
                        message: 'Forbidden',
                        data: 'Access forbidden'
                    }
                });
            }
            jwt.verify(token, env.JWT_KEY, (err, decoded) => {
                if (err) {
                    return res.status(403).json({
                        response: {
                            message: 'Forbidden',
                            data: 'Access forbidden'
                        }
                    });
                }
                req.user = decoded;
                next();
            });
        }
        catch (e) {
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.INTERNAL_ERROR,
                message: 'Internal Error',
                errors: [e.message]
            });
        }
    }
}
_a = Token;
/**
 * Generate token
 * @param req
 * @param res
 */
Token.generateToken = async (req, res) => {
    try {
        const { expiresIn } = req.body; // Cambiado de req a req.body
        const { _id, email } = req.body; // Cambiado de req a req.body
        const token = jwt.sign({ email: email, _id: _id }, env.JWT_KEY, { expiresIn: expiresIn || '60d' }); // Generate token
        return handler_helper_1.default.success(res, { message: 'Token created successfully', data: { token, expiresIn } }, codes_constanst_1.CREATED);
    }
    catch (e) {
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Internal Error',
            errors: [e.message]
        });
    }
};
exports.default = Token;
//# sourceMappingURL=token.js.map