"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMiddleware = void 0;
const logger_1 = require("../utils/logger");
const performanceMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.Logger.info(`[${req.method}] ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
    });
    next();
};
exports.performanceMiddleware = performanceMiddleware;
//# sourceMappingURL=performance.middleware.js.map