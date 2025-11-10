"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotDetectionMiddleware = void 0;
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getInstance('BotDetection');
/**
 * Middleware para detectar y bloquear bots conocidos
 */
class BotDetectionMiddleware {
    /**
     * Detecta si el User-Agent corresponde a un bot conocido
     */
    static detectBot(req, res, next) {
        var _a;
        const userAgent = ((_a = req.get('User-Agent')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        // Verificar si el User-Agent contiene alguna palabra clave de bot
        const isBot = this.knownBots.some(botKeyword => userAgent.includes(botKeyword.toLowerCase()));
        if (isBot) {
            logger.warn(`Bot detectado: ${userAgent}`, {
                ip: req.ip,
                path: req.path,
                userAgent: req.get('User-Agent')
            });
            return res.status(403).json({
                error: 'Acceso denegado: comportamiento sospechoso detectado',
                code: 'BOT_DETECTED'
            });
        }
        next();
    }
    /**
     * Middleware adicional para detectar patrones sospechosos
     */
    static detectSuspiciousPatterns(req, res, next) {
        const userAgent = req.get('User-Agent') || '';
        // Detectar User-Agents vacíos o muy cortos (posibles bots)
        if (!userAgent || userAgent.length < 10) {
            logger.warn('User-Agent sospechoso detectado: muy corto o vacío', {
                ip: req.ip,
                userAgent,
                path: req.path
            });
            return res.status(403).json({
                error: 'Acceso denegado: comportamiento sospechoso detectado',
                code: 'SUSPICIOUS_USER_AGENT'
            });
        }
        // Detectar User-Agents con patrones conocidos de automatización
        const suspiciousPatterns = [
            /script/i,
            /automation/i,
            /headless/i,
            /phantom/i,
            /selenium/i,
            /puppeteer/i,
            /playwright/i
        ];
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
        if (isSuspicious) {
            logger.warn('Patrón de automatización detectado', {
                ip: req.ip,
                userAgent,
                path: req.path
            });
            return res.status(403).json({
                error: 'Acceso denegado: comportamiento sospechoso detectado',
                code: 'AUTOMATION_DETECTED'
            });
        }
        next();
    }
}
exports.BotDetectionMiddleware = BotDetectionMiddleware;
BotDetectionMiddleware.knownBots = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'http',
    'python',
    'java',
    'go-http-client',
    'apache-httpclient',
    'okhttp',
    'googlebot',
    'bingbot',
    'slurp',
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'discordbot',
    'postman',
    'insomnia'
];
exports.default = BotDetectionMiddleware;
//# sourceMappingURL=bot-detection.middleware.js.map