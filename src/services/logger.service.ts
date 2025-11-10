import winston from 'winston';
import path from 'path';

class LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = 'logs';
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    );

    this.logger = winston.createLogger({
      format: logFormat,
      transports: [
        // Logs de error
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error'
        }),
        // Logs combinados
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log')
        }),
        // Logs en consola en desarrollo
        ...(process.env.NODE_ENV !== 'production' ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            )
          })
        ] : [])
      ]
    });
  }

  public info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  public error(message: string, error?: any) {
    this.logger.error(message, { error });
  }

  public warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  public http(message: string, meta?: any) {
    this.logger.http(message, meta);
  }
}

export default new LoggerService();