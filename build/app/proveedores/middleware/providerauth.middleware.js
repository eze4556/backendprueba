"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with your actual secret
const providerAuthMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Permitir acceso a providers y super_admin
        const isAllowed = decoded.isProvider || decoded.role === 'super_admin' || decoded.role === 'admin';
        if (!isAllowed) {
            return res.status(403).json({ error: 'Unauthorized: Provider or admin role required' });
        }
        req.user = {
            id: decoded.id,
            isProvider: decoded.isProvider || false,
            email: decoded.email || '',
            role: decoded.role || '',
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.default = providerAuthMiddleware;
//# sourceMappingURL=providerauth.middleware.js.map