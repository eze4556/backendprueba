"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputValidationMiddleware = exports.securityHeadersMiddleware = exports.auditLogMiddleware = exports.geoBlockingMiddleware = exports.xssSanitizeMiddleware = exports.noSQLSanitizeMiddleware = exports.botDetectionMiddleware = exports.rateLimitMiddleware = void 0;
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger = logger_1.Logger.getInstance('SecurityMiddleware');
/**
 * Rate Limiting Middleware
 * Controla la velocidad de requests por IP/usuario
 */
const requestCounts = new Map();
const rateLimitMiddleware = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutos por defecto
    const maxRequests = options.maxRequests || 100; // 100 requests por defecto
    const message = options.message || 'Demasiadas solicitudes, intenta de nuevo más tarde';
    return (req, res, next) => {
        const now = Date.now();
        const clientId = req.ip || req.socket.remoteAddress || 'unknown';
        const clientData = requestCounts.get(clientId) || { count: 0, resetTime: now + windowMs };
        // Resetear contador si ha pasado la ventana de tiempo
        if (now > clientData.resetTime) {
            clientData.count = 0;
            clientData.resetTime = now + windowMs;
        }
        clientData.count++;
        requestCounts.set(clientId, clientData);
        if (clientData.count > maxRequests) {
            logger.warn('Rate limit exceeded', {
                ip: clientId,
                count: clientData.count,
                limit: maxRequests
            });
            return res.status(429).json({
                error: message,
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            });
        }
        // Añadir headers informativos
        res.set({
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count).toString(),
            'X-RateLimit-Reset': Math.ceil(clientData.resetTime / 1000).toString()
        });
        next();
    };
};
exports.rateLimitMiddleware = rateLimitMiddleware;
/**
 * Bot Detection Middleware
 * Detecta y bloquea comportamiento automatizado sospechoso
 */
const botDetectionMiddleware = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousAgents = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
        'python-requests', 'googlebot', 'bingbot', 'yahoobot',
        'facebookexternalhit', 'twitterbot', 'linkedinbot',
        'whatsapp', 'telegram', 'slackbot', 'discordbot'
    ];
    const isSuspicious = suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent.toLowerCase()));
    if (isSuspicious) {
        logger.warn('Suspicious bot detected', {
            ip: req.ip,
            userAgent,
            url: req.url,
            method: req.method
        });
        return res.status(403).json({
            error: 'Acceso denegado: comportamiento sospechoso detectado',
            code: 'BOT_DETECTED'
        });
    }
    next();
};
exports.botDetectionMiddleware = botDetectionMiddleware;
/**
 * NoSQL Injection Prevention Middleware
 * Sanitiza objetos de entrada para prevenir inyecciones NoSQL
 */
const noSQLSanitizeMiddleware = (req, res, next) => {
    const sanitizeObject = (obj, path = '') => {
        if (typeof obj !== 'object' || obj === null)
            return obj;
        const sanitized = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                // Sanitizar operadores de MongoDB/NoSQL
                if (key.startsWith('$')) {
                    // Convertir operadores peligrosos a strings seguros
                    sanitized[`_safe_${key.substring(1)}`] = JSON.stringify(obj[key]);
                    logger.warn('NoSQL operator sanitized', {
                        original: key,
                        sanitized: `_safe_${key.substring(1)}`,
                        path: path,
                        ip: req.ip
                    });
                }
                else {
                    sanitized[key] = sanitizeObject(obj[key], `${path}.${key}`);
                }
            }
            else {
                sanitized[key] = obj[key];
            }
        }
        return sanitized;
    };
    // Sanitizar body, query y params
    if (req.body) {
        req.body = sanitizeObject(req.body, 'body');
    }
    if (req.query) {
        req.query = sanitizeObject(req.query, 'query');
    }
    if (req.params) {
        req.params = sanitizeObject(req.params, 'params');
    }
    next();
};
exports.noSQLSanitizeMiddleware = noSQLSanitizeMiddleware;
/**
 * XSS Protection Middleware
 * Sanitiza strings para prevenir ataques XSS
 */
const xssSanitizeMiddleware = (req, res, next) => {
    const sanitizeString = (str) => {
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    };
    const sanitizeObject = (obj) => {
        if (typeof obj === 'string') {
            return sanitizeString(obj);
        }
        if (typeof obj === 'object' && obj !== null) {
            const sanitized = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};
exports.xssSanitizeMiddleware = xssSanitizeMiddleware;
/**
 * Geo-blocking Middleware
 * Bloquea requests desde países específicos
 */
const geoBlockingMiddleware = (blockedCountries = []) => {
    return (req, res, next) => {
        // Headers comunes de geo-localización
        const country = req.get('CF-IPCountry') || // Cloudflare
            req.get('X-Country-Code') || // Otros proxies
            req.get('CloudFront-Viewer-Country') || // AWS CloudFront
            'US'; // Default
        if (blockedCountries.includes(country)) {
            logger.warn('Geo-blocked request', {
                ip: req.ip,
                country,
                url: req.url,
                userAgent: req.get('User-Agent')
            });
            return res.status(403).json({
                error: 'Acceso denegado desde tu ubicación geográfica',
                code: 'GEO_BLOCKED',
                country
            });
        }
        next();
    };
};
exports.geoBlockingMiddleware = geoBlockingMiddleware;
/**
 * Audit Logging Middleware
 * Registra todas las requests para auditoría
 */
const auditLogMiddleware = (req, res, next) => {
    var _a, _b;
    const authReq = req;
    const auditLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        userId: ((_a = authReq.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous',
        userRole: ((_b = authReq.user) === null || _b === void 0 ? void 0 : _b.role) || 'unknown',
        body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
        query: Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : null
    };
    // Log para auditoría
    logger.info('Request audit', auditLog);
    // En producción, escribir a archivo de auditoría
    if (process.env.NODE_ENV === 'production') {
        writeAuditLog(auditLog);
    }
    // Para pruebas: almacenar en variable global
    if (process.env.NODE_ENV === 'test' && global.auditLogs) {
        global.auditLogs.push(['audit', auditLog]);
    }
    // Capturar respuesta para logging completo
    const originalSend = res.send;
    res.send = function (data) {
        const responseLog = {
            requestId: auditLog.timestamp,
            statusCode: res.statusCode,
            responseSize: data ? data.length : 0,
            timestamp: new Date().toISOString()
        };
        logger.info('Response audit', responseLog);
        // En producción, escribir respuesta a archivo de auditoría
        if (process.env.NODE_ENV === 'production') {
            writeAuditLog({ ...auditLog, response: responseLog });
        }
        // Para pruebas: almacenar respuesta en variable global
        if (process.env.NODE_ENV === 'test' && global.auditLogs) {
            global.auditLogs.push(['response_audit', responseLog]);
        }
        return originalSend.call(this, data);
    };
    next();
};
exports.auditLogMiddleware = auditLogMiddleware;
/**
 * Función para escribir logs de auditoría a archivo en producción
 */
function writeAuditLog(logData) {
    try {
        const auditLogPath = process.env.AUDIT_LOG_PATH || './logs/audit.log';
        const logDir = path_1.default.dirname(auditLogPath);
        // Crear directorio si no existe
        if (!fs_1.default.existsSync(logDir)) {
            fs_1.default.mkdirSync(logDir, { recursive: true });
        }
        const logEntry = `${JSON.stringify(logData)}\n`;
        fs_1.default.appendFileSync(auditLogPath, logEntry);
    }
    catch (error) {
        logger.error('Error writing audit log to file', error);
    }
}
/**
 * Security Headers Middleware
 * Añade headers de seguridad estándar
 */
const securityHeadersMiddleware = (req, res, next) => {
    // Headers de seguridad
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // CSP básico
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    next();
};
exports.securityHeadersMiddleware = securityHeadersMiddleware;
/**
 * Input Validation Middleware
 * Valida longitud y formato de inputs
 */
const inputValidationMiddleware = (options = {}) => {
    const maxStringLength = options.maxStringLength || 1000;
    const maxDepth = options.maxDepth || 10;
    return (req, res, next) => {
        const validateStringLength = (obj, path = '', depth = 0) => {
            if (depth > maxDepth) {
                logger.warn('Object depth exceeded', { path, depth, maxDepth, ip: req.ip });
                return false;
            }
            for (const key in obj) {
                const currentPath = path ? `${path}.${key}` : key;
                if (typeof obj[key] === 'string' && obj[key].length > maxStringLength) {
                    logger.warn('String length exceeded', {
                        path: currentPath,
                        length: obj[key].length,
                        maxLength: maxStringLength,
                        ip: req.ip
                    });
                    return false;
                }
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    if (!validateStringLength(obj[key], currentPath, depth + 1)) {
                        return false;
                    }
                }
            }
            return true;
        };
        // Validar body
        if (req.body && !validateStringLength(req.body, 'body')) {
            return res.status(400).json({
                error: 'Datos de entrada inválidos: longitud o profundidad excedida',
                code: 'VALIDATION_ERROR'
            });
        }
        // Validar query
        if (req.query && !validateStringLength(req.query, 'query')) {
            return res.status(400).json({
                error: 'Parámetros de consulta inválidos: longitud excedida',
                code: 'VALIDATION_ERROR'
            });
        }
        next();
    };
};
exports.inputValidationMiddleware = inputValidationMiddleware;
//# sourceMappingURL=security-advanced.middleware.js.map