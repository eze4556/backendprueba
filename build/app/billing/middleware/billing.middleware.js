"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingAuthMiddleware = billingAuthMiddleware;
function billingAuthMiddleware(req, res, next) {
    // Validar JWT y rol de forma segura
    const user = typeof req.user === 'object' ? req.user : null;
    const role = (user === null || user === void 0 ? void 0 : user.role) || (user === null || user === void 0 ? void 0 : user.rol);
    if (!user || !role || !['admin', 'contador'].includes(role)) {
        return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
}
//# sourceMappingURL=billing.middleware.js.map