"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
class LoggerService {
    constructor() {
        const logDir = 'logs';
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
        this.logger = winston_1.default.createLogger({
            format: logFormat,
            transports: [
                // Logs de error
                new winston_1.default.transports.File({
                    filename: path_1.default.join(logDir, 'error.log'),
                    level: 'error'
                }),
                // Logs combinados
                new winston_1.default.transports.File({
                    filename: path_1.default.join(logDir, 'combined.log')
                }),
                // Logs en consola en desarrollo
                ...(process.env.NODE_ENV !== 'production' ? [
                    new winston_1.default.transports.Console({
                        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                    })
                ] : [])
            ]
        });
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    error(message, error) {
        this.logger.error(message, { error });
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    http(message, meta) {
        this.logger.http(message, meta);
    }
}
exports.default = new LoggerService();
//# sourceMappingURL=logger.service.js.map