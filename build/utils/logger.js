"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class LoggerService {
    constructor() {
        this.logDir = 'logs';
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            debug: 4,
        };
        this.colors = {
            error: 'red',
            warn: 'yellow',
            info: 'green',
            http: 'magenta',
            debug: 'white',
        };
        this.loggers = new Map();
        this.ensureLogDirectory();
        winston_1.default.addColors(this.colors);
    }
    ensureLogDirectory() {
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir);
        }
    }
    static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }
    getLogger(context) {
        if (!this.loggers.has(context)) {
            this.loggers.set(context, this.createLogger(context));
        }
        return this.loggers.get(context);
    }
    createLogger(context) {
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf(({ timestamp, level, message, metadata, service }) => {
            const metaStr = metadata && Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
            return `[${service || context}] ${timestamp} ${level}: ${message}${metaStr}`;
        }));
        return winston_1.default.createLogger({
            level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
            levels: this.levels,
            format: logFormat,
            defaultMeta: { service: context },
            transports: [
                new winston_1.default.transports.Console(),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(this.logDir, `${context}-error.log`),
                    level: 'error'
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(this.logDir, `${context}-combined.log`)
                })
            ]
        });
    }
}
class Logger {
    constructor(context) {
        this.logger = Logger.loggerService.getLogger(context);
    }
    static getInstance(context) {
        return Logger.loggerService.getLogger(context);
    }
    info(message, meta) {
        this.logger.info(message, { metadata: meta });
    }
    error(message, meta) {
        this.logger.error(message, { metadata: meta });
    }
    warn(message, meta) {
        this.logger.warn(message, { metadata: meta });
    }
    debug(message, meta) {
        this.logger.debug(message, { metadata: meta });
    }
    http(message, meta) {
        this.logger.http(message, { metadata: meta });
    }
}
exports.Logger = Logger;
Logger.loggerService = LoggerService.getInstance();
const createLogger = (context) => {
    return new Logger(context);
};
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map