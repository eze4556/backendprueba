import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Crear instancia de caché con TTL de 5 minutos por defecto
const cache = new NodeCache({ stdTTL: 300 });

interface CacheOptions {
  ttl?: number;
  key?: string | ((req: Request) => string);
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
    res.send = function(body): Response {
      if (res.statusCode === 200) {
        cache.set(key, body, options.ttl || 300);
      }
      return originalSend.call(this, body);
    };

    next();
  };
};

// Función para limpiar el caché cuando se hacen modificaciones
export const clearCache = (pattern?: string) => {
  if (pattern) {
    const keys = cache.keys().filter(key => key.includes(pattern));
    keys.forEach(key => cache.del(key));
  } else {
    cache.flushAll();
  }
};