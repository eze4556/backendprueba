"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.cacheMiddleware = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
// Crear instancia de caché con TTL de 5 minutos por defecto
const cache = new node_cache_1.default({ stdTTL: 300 });
const cacheMiddleware = (options = {}) => {
    return (req, res, next) => {
        if (req.method !== 'GET') {
            return next();
        }
        const key = typeof options.key === 'function'
            ? options.key(req)
            : options.key || req.originalUrl;
        const cachedResponse = cache.get(key);
        if (cachedResponse) {
            return res.send(cachedResponse);
        }
        const originalSend = res.send;
        res.send = function (body) {
            if (res.statusCode === 200) {
                cache.set(key, body, options.ttl || 300);
            }
            return originalSend.call(this, body);
        };
        next();
    };
};
exports.cacheMiddleware = cacheMiddleware;
// Función para limpiar el caché cuando se hacen modificaciones
const clearCache = (pattern) => {
    if (pattern) {
        const keys = cache.keys().filter(key => key.includes(pattern));
        keys.forEach(key => cache.del(key));
    }
    else {
        cache.flushAll();
    }
};
exports.clearCache = clearCache;
//# sourceMappingURL=cache.middleware.js.map