import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance('BotDetection');

/**
 * Middleware para detectar y bloquear bots conocidos
 */
export class BotDetectionMiddleware {
  private static knownBots = [
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

  /**
   * Detecta si el User-Agent corresponde a un bot conocido
   */
  public static detectBot(req: Request, res: Response, next: NextFunction): Response | void {
    const userAgent = req.get('User-Agent')?.toLowerCase() || '';
    
    // Verificar si el User-Agent contiene alguna palabra clave de bot
    const isBot = this.knownBots.some(botKeyword => 
      userAgent.includes(botKeyword.toLowerCase())
    );

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
  public static detectSuspiciousPatterns(req: Request, res: Response, next: NextFunction): Response | void {
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

export default BotDetectionMiddleware;