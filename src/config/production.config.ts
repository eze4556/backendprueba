import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno según el entorno
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'test' 
    ? '.env.test' 
    : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export interface ProductionConfig {
  // Servidor
  port: number;
  host: string;
  nodeEnv: string;
  
  // Base de datos
  mongodbUri: string;
  
  // JWT
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  
  // AWS
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    mediaLiveChannelId: string;
    mediaPackageUrl: string;
  };
  
  // Email
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  
  // Pagos
  payments: {
    paypal: {
      clientId: string;
      clientSecret: string;
      mode: 'live' | 'sandbox';
    };
    stripe: {
      publishableKey: string;
      secretKey: string;
      webhookSecret: string;
    };
    mercadoPago: {
      accessToken: string;
      publicKey: string;
    };
  };
  
  // Seguridad
  security: {
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    bcryptSaltRounds: number;
    corsOrigin: string[];
    corsCredentials: boolean;
    botDetectionEnabled: boolean;
    botDetectionStrictMode: boolean;
    geoBlockingEnabled: boolean;
    allowedCountries: string[];
    blockedCountries: string[];
  };
  
  // Logging
  logging: {
    level: string;
    filePath: string;
    auditLogPath: string;
  };
  
  // Monitoreo
  monitoring: {
    enabled: boolean;
    metricsPort: number;
    healthCheckInterval: number;
    healthCheckTimeout: number;
  };
  
  // Cache
  cache: {
    redisUrl: string;
    ttl: number;
  };
  
  // SSL
  ssl: {
    enabled: boolean;
    certPath?: string;
    keyPath?: string;
  };
}

export const productionConfig: ProductionConfig = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodbUri: process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/likevendor',
  
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-development-only',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    mediaLiveChannelId: process.env.AWS_MEDIALIVE_CHANNEL_ID || '',
    mediaPackageUrl: process.env.AWS_MEDIAPACKAGE_URL || '',
  },
  
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587'),
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'noreply@likevendor.com',
  },
  
  payments: {
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      mode: (process.env.PAYPAL_MODE as 'live' | 'sandbox') || 'sandbox',
    },
    stripe: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    mercadoPago: {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY || '',
    },
  },
  
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
    corsCredentials: process.env.CORS_CREDENTIALS === 'true',
    botDetectionEnabled: process.env.BOT_DETECTION_ENABLED === 'true',
    botDetectionStrictMode: process.env.BOT_DETECTION_STRICT_MODE === 'true',
    geoBlockingEnabled: process.env.GEO_BLOCKING_ENABLED === 'true',
    allowedCountries: process.env.ALLOWED_COUNTRIES ? process.env.ALLOWED_COUNTRIES.split(',') : [],
    blockedCountries: process.env.BLOCKED_COUNTRIES ? process.env.BLOCKED_COUNTRIES.split(',') : [],
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    auditLogPath: process.env.AUDIT_LOG_PATH || './logs/audit.log',
  },
  
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '30000'),
  },
  
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
  },
  
  ssl: {
    enabled: process.env.SSL_ENABLED === 'true',
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH,
  },
};

// Validación de configuración crítica en producción
export function validateProductionConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    const requiredFields = [
      'JWT_SECRET',
      'MONGODB_URI',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_S3_BUCKET'
    ];
    
    const missingFields = requiredFields.filter(field => !process.env[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Faltan variables de entorno críticas para producción: ${missingFields.join(', ')}`);
    }
    
    // Validar longitud del JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción');
    }
  }
}