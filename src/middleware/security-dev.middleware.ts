import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('SecurityDev');

/**
 * Development-friendly Bot Detection Middleware
 * Versión más permisiva para desarrollo que no bloquea navegadores web
 */
export const devBotDetectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Solo bloquear bots muy obvios, no navegadores
  const maliciousBots = [
    'curl', 'wget', 'python-requests', 'scrapy', 'masscan', 
    'nmap', 'sqlmap', 'nikto', 'burpsuite', 'nuclei'
  ];
  
  const isMalicious = maliciousBots.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
  
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

/**
 * Development-friendly Geo-blocking Middleware
 * Versión que solo loggea pero no bloquea para desarrollo
 */
export const devGeoBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Rate Limiting más permisivo para desarrollo
 */
export const devRateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // En desarrollo, solo loggear sin límites estrictos
  const requestCount = (global as any).requestCount || 0;
  (global as any).requestCount = requestCount + 1;
  
  if (requestCount % 100 === 0) {
    logger.info('Request count milestone', {
      count: requestCount,
      ip: req.ip
    });
  }
  
  next();
};