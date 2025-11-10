import dotenv from 'dotenv';

// Cargar variables de entorno específicas para desarrollo
dotenv.config({ path: '.env.development' });

export interface DevelopmentConfig {
  server: {
    port: number;
    host: string;
    nodeEnv: string;
  };
  database: {
    uri: string;
    options: {
      maxPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  security: {
    rateLimit: {
      windowMs: number;
      max: number;
    };
    bcryptRounds: number;
  };
  monitoring: {
    healthCheckTimeout: number;
    logLevel: string;
  };
}

/**
 * Configuración para entorno de desarrollo
 */
export const developmentConfig: DevelopmentConfig = {
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
export const validateDevelopmentConfig = (): void => {
  const requiredEnvVars = ['JWT_SECRET'];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables in development: ${missingVars.join(', ')}`);
    console.warn(`⚠️  Using default values. For production deployment, ensure all variables are set.`);
  }
};

/**
 * Obtener configuración según el entorno
 */
export const getEnvironmentConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    const { productionConfig } = require('./production.config');
    return productionConfig;
  }
  
  return developmentConfig;
};

export default developmentConfig;