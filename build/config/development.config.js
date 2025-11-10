"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvironmentConfig = exports.validateDevelopmentConfig = exports.developmentConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Cargar variables de entorno específicas para desarrollo
dotenv_1.default.config({ path: '.env.development' });
/**
 * Configuración para entorno de desarrollo
 */
exports.developmentConfig = {
    server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test-lv-dev',
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:4200',
            'http://127.0.0.1:3000'
        ],
        credentials: true,
        optionsSuccessStatus: 200
    },
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 1000 // Más permisivo en desarrollo
        },
        bcryptRounds: 10
    },
    monitoring: {
        healthCheckTimeout: 10000, // 10 segundos
        logLevel: 'debug'
    }
};
/**
 * Validar configuración de desarrollo
 */
const validateDevelopmentConfig = () => {
    const requiredEnvVars = ['JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.warn(`⚠️  Warning: Missing environment variables in development: ${missingVars.join(', ')}`);
        console.warn(`⚠️  Using default values. For production deployment, ensure all variables are set.`);
    }
};
exports.validateDevelopmentConfig = validateDevelopmentConfig;
/**
 * Obtener configuración según el entorno
 */
const getEnvironmentConfig = () => {
    if (process.env.NODE_ENV === 'production') {
        const { productionConfig } = require('./production.config');
        return productionConfig;
    }
    return exports.developmentConfig;
};
exports.getEnvironmentConfig = getEnvironmentConfig;
exports.default = exports.developmentConfig;
//# sourceMappingURL=development.config.js.map