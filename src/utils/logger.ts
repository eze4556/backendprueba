import winston from 'winston';
import path from 'path';
import fs from 'fs';

class LoggerService {
    private static instance: LoggerService;
    private loggers: Map<string, winston.Logger>;
    private readonly logDir: string = 'logs';
    private readonly levels = {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    };
    private readonly colors = {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'white',
    };

    private constructor() {
        this.loggers = new Map();
        this.ensureLogDirectory();
        winston.addColors(this.colors);
    }

    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir);
        }
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    public getLogger(context: string): winston.Logger {
        if (!this.loggers.has(context)) {
            this.loggers.set(context, this.createLogger(context));
        }
        return this.loggers.get(context)!;
    }

    private createLogger(context: string): winston.Logger {
        const logFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
            winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, metadata, service }) => {
                const metaStr = metadata && Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
                return `[${service || context}] ${timestamp} ${level}: ${message}${metaStr}`;
            })
        );

        return winston.createLogger({
            level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
            levels: this.levels,
            format: logFormat,
            defaultMeta: { service: context },
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: path.join(this.logDir, `${context}-error.log`),
                    level: 'error'
                }),
                new winston.transports.File({
                    filename: path.join(this.logDir, `${context}-combined.log`)
                })
            ]
        });
    }
}

export class Logger {
    private static readonly loggerService = LoggerService.getInstance();
    private readonly logger: winston.Logger;
    static info: any;

    constructor(context: string) {
        this.logger = Logger.loggerService.getLogger(context);
    }

    public static getInstance(context: string): winston.Logger {
        return Logger.loggerService.getLogger(context);
    }

    public info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, { metadata: meta });
    }

    public error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(message, { metadata: meta });
    }

    public warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, { metadata: meta });
    }

    public debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, { metadata: meta });
    }

    public http(message: string, meta?: Record<string, unknown>): void {
        this.logger.http(message, { metadata: meta });
    }
}

export const createLogger = (context: string): Logger => {
    return new Logger(context);
};
