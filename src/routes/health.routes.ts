import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { productionConfig } from '../config/production.config';

/**
 * Health check endpoint
 * Verifica el estado de la aplicación y sus dependencias
 */
export const healthCheck = async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Basic system info
    const systemInfo = {
      uptime: Math.round(process.uptime()),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: systemInfo.uptime,
      responseTime: `${responseTime}ms`,
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      memory: memoryUsageMB,
      system: systemInfo,
      version: '1.0.0'
    };

    res.status(200).json(healthData);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      version: '1.0.0'
    });
  }
};

/**
 * Liveness probe - verificación básica de que la aplicación está viva
 */
export const livenessProbe = (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
};

/**
 * Readiness probe - verificación de que la aplicación está lista para recibir tráfico
 */
export const readinessProbe = async (req: Request, res: Response) => {
  try {
    // Verificar conexión a la base de datos
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    res.status(200).json({ 
      status: 'ready', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not ready', 
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Health Check Completo para Producción
 */
export const productionHealthCheck = async (req: Request, res: Response): Promise<Response> => {
  const startTime = Date.now();
  const result = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'disconnected' as 'connected' | 'disconnected' | 'error', responseTime: 0 },
      aws: { status: 'not-configured' as 'configured' | 'not-configured', services: [] as string[] },
      memory: { used: 0, free: 0, percentage: 0 }
    },
    checks: {} as any
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

  // Verificar tiempo de respuesta total
  const totalResponseTime = Date.now() - startTime;
  result.checks.responseTime = {
    status: totalResponseTime < 5000 ? 'pass' : 'fail',
    message: `Response time: ${totalResponseTime}ms`,
    responseTime: totalResponseTime
  };

  // Retornar resultado con código de estado apropiado
  const statusCode = result.status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json(result);
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