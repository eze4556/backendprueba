"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devRateLimitMiddleware = exports.devGeoBlockingMiddleware = exports.devBotDetectionMiddleware = void 0;
const logger_1 = require("../utils/logger");
const logger = new logger_1.Logger('SecurityDev');
/**
 * Development-friendly Bot Detection Middleware
 * Versión más permisiva para desarrollo que no bloquea navegadores web
 */
const devBotDetectionMiddleware = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    // Solo bloquear bots muy obvios, no navegadores
    const maliciousBots = [
        'curl', 'wget', 'python-requests', 'scrapy', 'masscan',
        'nmap', 'sqlmap', 'nikto', 'burpsuite', 'nuclei'
    ];
    const isMalicious = maliciousBots.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
    if (isMalicious) {
        logger.warn('Malicious bot detected', {
            ip: req.ip,
            userAgent,
            url: req.url,
            method: req.method
        });
        return res.status(403).json({
            error: 'Acceso denegado: comportamiento malicioso detectado',
            code: 'MALICIOUS_BOT_DETECTED'
        });
    }
    // Solo loggear para análisis, no bloquear
    if (userAgent.toLowerCase().includes('bot')) {
        logger.info('Bot detected but allowed', {
            ip: req.ip,
            userAgent,
            url: req.url
        });
    }
    next();
};
exports.devBotDetectionMiddleware = devBotDetectionMiddleware;
/**
 * Development-friendly Geo-blocking Middleware
 * Versión que solo loggea pero no bloquea para desarrollo
 */
const devGeoBlockingMiddleware = (req, res, next) => {
    const clientCountry = req.get('CF-IPCountry') || 'Unknown';
    // Solo loggear ubicación para análisis
    logger.info('Request geo location', {
        ip: req.ip,
        country: clientCountry,
        url: req.url
    });
    // En desarrollo, no bloqueamos nada
    next();
};
exports.devGeoBlockingMiddleware = devGeoBlockingMiddleware;
/**
 * Rate Limiting más permisivo para desarrollo
 */
const devRateLimitMiddleware = (req, res, next) => {
    // En desarrollo, solo loggear sin límites estrictos
    const requestCount = global.requestCount || 0;
    global.requestCount = requestCount + 1;
    if (requestCount % 100 === 0) {
        logger.info('Request count milestone', {
            count: requestCount,
            ip: req.ip
        });
    }
    next();
};
exports.devRateLimitMiddleware = devRateLimitMiddleware;
//# sourceMappingURL=security-dev.middleware.js.map