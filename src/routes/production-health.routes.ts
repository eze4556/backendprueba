import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { productionConfig } from '../config/production.config';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      responseTime?: number;
    };
    aws: {
      status: 'configured' | 'not-configured';
      services: string[];
    };
    memory: {
      used: number;
      free: number;
      percentage: number;
    };
    disk?: {
      used: number;
      free: number;
      percentage: number;
    };
  };
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
      responseTime?: number;
    };
  };
}

/**
 * Health Check Completo para Producción
 */
export const productionHealthCheck = async (req: Request, res: Response): Promise<Response> => {
  const startTime = Date.now();
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'disconnected' },
      aws: { status: 'not-configured', services: [] },
      memory: { used: 0, free: 0, percentage: 0 }
    },
    checks: {}
  };

  // Verificar conexión a MongoDB
  try {
    const dbStart = Date.now();
    const dbState = mongoose.connection.readyState;
    const dbResponseTime = Date.now() - dbStart;
    
    if (dbState === 1) {
      result.services.database = {
        status: 'connected',
        responseTime: dbResponseTime
      };
      result.checks.database = {
        status: 'pass',
        message: 'Database connection is healthy',
        responseTime: dbResponseTime
      };
    } else {
      result.services.database.status = 'disconnected';
      result.checks.database = {
        status: 'fail',
        message: `Database state: ${dbState}`
      };
      result.status = 'unhealthy';
    }
  } catch (error) {
    result.services.database.status = 'error';
    result.checks.database = {
      status: 'fail',
      message: `Database error: ${error}`
    };
    result.status = 'unhealthy';
  }

  // Verificar configuración de AWS
  try {
    const awsServices: string[] = [];
    if (productionConfig.aws.accessKeyId && productionConfig.aws.secretAccessKey) {
      result.services.aws.status = 'configured';
      if (productionConfig.aws.s3Bucket) awsServices.push('S3');
      if (productionConfig.aws.mediaLiveChannelId) awsServices.push('MediaLive');
      if (productionConfig.aws.mediaPackageUrl) awsServices.push('MediaPackage');
      result.services.aws.services = awsServices;
      
      result.checks.aws = {
        status: 'pass',
        message: `AWS configured with services: ${awsServices.join(', ')}`
      };
    } else {
      result.checks.aws = {
        status: 'fail',
        message: 'AWS credentials not configured'
      };
      result.status = 'unhealthy';
    }
  } catch (error) {
    result.checks.aws = {
      status: 'fail',
      message: `AWS configuration error: ${error}`
    };
    result.status = 'unhealthy';
  }

  // Verificar memoria del sistema
  try {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const freeMem = totalMem - usedMem;
    const memPercentage = Math.round((usedMem / totalMem) * 100);

    result.services.memory = {
      used: Math.round(usedMem / 1024 / 1024), // MB
      free: Math.round(freeMem / 1024 / 1024), // MB
      percentage: memPercentage
    };

    if (memPercentage > 90) {
      result.checks.memory = {
        status: 'fail',
        message: `High memory usage: ${memPercentage}%`
      };
      result.status = 'unhealthy';
    } else {
      result.checks.memory = {
        status: 'pass',
        message: `Memory usage: ${memPercentage}%`
      };
    }
  } catch (error) {
    result.checks.memory = {
      status: 'fail',
      message: `Memory check error: ${error}`
    };
    result.status = 'unhealthy';
  }

  // Verificar variables de entorno críticas en producción
  if (process.env.NODE_ENV === 'production') {
    const criticalEnvVars = [
      'JWT_SECRET',
      'MONGODB_URI',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      result.checks.environment = {
        status: 'fail',
        message: `Missing critical environment variables: ${missingVars.join(', ')}`
      };
      result.status = 'unhealthy';
    } else {
      result.checks.environment = {
        status: 'pass',
        message: 'All critical environment variables are set'
      };
    }
  }

  // Verificar tiempo de respuesta total
  const totalResponseTime = Date.now() - startTime;
  if (totalResponseTime > productionConfig.monitoring.healthCheckTimeout) {
    result.checks.responseTime = {
      status: 'fail',
      message: `Health check timeout: ${totalResponseTime}ms > ${productionConfig.monitoring.healthCheckTimeout}ms`,
      responseTime: totalResponseTime
    };
    result.status = 'unhealthy';
  } else {
    result.checks.responseTime = {
      status: 'pass',
      message: `Response time: ${totalResponseTime}ms`,
      responseTime: totalResponseTime
    };
  }

  // Retornar resultado con código de estado apropiado
  const statusCode = result.status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json(result);
};

/**
 * Liveness Probe - Verifica que el proceso esté corriendo
 */
export const livenessProbe = (req: Request, res: Response): Response => {
  return res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
};

/**
 * Readiness Probe - Verifica que el servicio esté listo para recibir tráfico
 */
export const readinessProbe = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Verificar conexión a base de datos
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'not-ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Verificar configuración mínima
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
        return res.status(503).json({
          status: 'not-ready',
          reason: 'Critical configuration missing',
          timestamp: new Date().toISOString()
        });
      }
    }

    return res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: 'connected',
      configuration: 'complete'
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not-ready',
      reason: `Error: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Metrics Endpoint para monitoreo
 */
export const metricsEndpoint = (req: Request, res: Response): Response => {
  const memUsage = process.memoryUsage();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
      },
      cpu: process.cpuUsage()
    },
    database: {
      state: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json(metrics);
};