import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Mock de servicios de performance y carga
class PerformanceTestService {
  private metrics: any[] = [];
  private operations: any[] = [];
  private errors: any[] = [];

  recordOperation(operation: string, duration: number, success: boolean): void {
    this.operations.push({
      operation,
      duration,
      success,
      timestamp: new Date()
    });
  }

  recordError(error: string, operation: string): void {
    this.errors.push({
      error,
      operation,
      timestamp: new Date()
    });
  }

  getMetrics(): any {
    const totalOps = this.operations.length;
    const successfulOps = this.operations.filter(op => op.success).length;
    const avgDuration = this.operations.reduce((sum, op) => sum + op.duration, 0) / totalOps;
    
    return {
      totalOperations: totalOps,
      successfulOperations: successfulOps,
      successRate: totalOps > 0 ? (successfulOps / totalOps) * 100 : 0,
      averageDuration: avgDuration || 0,
      totalErrors: this.errors.length,
      errorRate: totalOps > 0 ? (this.errors.length / totalOps) * 100 : 0
    };
  }

  clear(): void {
    this.metrics = [];
    this.operations = [];
    this.errors = [];
  }

  // Simulación de operaciones pesadas
  async heavyOperation(size: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Simular procesamiento de datos grandes
      const data = Array.from({ length: size }, (_, i) => ({
        id: i,
        value: Math.random() * 1000,
        processed: true,
        timestamp: new Date()
      }));

      // Simular operaciones de cálculo
      const result = data
        .filter(item => item.value > 500)
        .map(item => ({ ...item, processed: true, score: item.value * 2 }))
        .sort((a, b) => b.score - a.score);

      const duration = Date.now() - startTime;
      this.recordOperation('heavyOperation', duration, true);

      return {
        processedItems: result.length,
        totalItems: size,
        duration,
        timestamp: new Date()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation('heavyOperation', duration, false);
      this.recordError((error as Error).message, 'heavyOperation');
      throw error;
    }
  }

  // Simulación de múltiples conexiones de base de datos
  async simulateDBOperations(count: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      const operations = Array.from({ length: count }, async (_, i) => {
        // Simular latencia de DB
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        return {
          id: new mongoose.Types.ObjectId().toString(),
          data: `Record ${i}`,
          created: new Date()
        };
      });

      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;
      
      this.recordOperation('dbOperations', duration, true);
      
      return {
        operations: count,
        results: results.length,
        duration,
        avgLatency: duration / count
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation('dbOperations', duration, false);
      this.recordError((error as Error).message, 'dbOperations');
      throw error;
    }
  }

  // Simulación de API externa
  async simulateExternalAPI(requests: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      const apiCalls = Array.from({ length: requests }, async (_, i) => {
        // Simular latencia de red
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        
        // Simular tasa de error del 5%
        if (Math.random() < 0.05) {
          throw new Error(`API call ${i} failed`);
        }
        
        return {
          id: i,
          status: 'success',
          data: `Response ${i}`,
          latency: Math.random() * 300
        };
      });

      const results = await Promise.allSettled(apiCalls);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const duration = Date.now() - startTime;
      
      this.recordOperation('externalAPI', duration, failed === 0);
      
      if (failed > 0) {
        this.recordError(`${failed} API calls failed`, 'externalAPI');
      }
      
      return {
        totalRequests: requests,
        successful,
        failed,
        duration,
        successRate: (successful / requests) * 100
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation('externalAPI', duration, false);
      this.recordError((error as Error).message, 'externalAPI');
      throw error;
    }
  }

  // Simulación de memoria y CPU bajo carga
  async simulateResourceIntensiveTask(): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Simular uso intensivo de memoria
      const largeData = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(100),
        nested: {
          values: Array.from({ length: 10 }, () => Math.random()),
          metadata: {
            created: new Date(),
            processed: false
          }
        }
      }));

      // Simular procesamiento intensivo de CPU
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i) * Math.sin(i);
      }

      // Simular operaciones de transformación de datos
      const processed = largeData
        .filter((_, i) => i % 100 === 0)
        .map(item => ({
          ...item,
          nested: {
            ...item.nested,
            metadata: {
              ...item.nested.metadata,
              processed: true,
              result: result / 1000000
            }
          }
        }));

      const duration = Date.now() - startTime;
      this.recordOperation('resourceIntensive', duration, true);

      return {
        processedItems: processed.length,
        computationResult: result,
        memoryUsed: largeData.length * 100, // Aproximación
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation('resourceIntensive', duration, false);
      this.recordError((error as Error).message, 'resourceIntensive');
      throw error;
    }
  }
}

const performanceService = new PerformanceTestService();

// Middleware de medición de performance
const performanceMiddleware = (req: any, res: any, next: any) => {
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body: any) {
    const duration = Date.now() - req.startTime;
    const success = res.statusCode < 400;
    
    performanceService.recordOperation(
      `${req.method} ${req.path}`,
      duration,
      success
    );
    
    return originalSend.call(this, body);
  };
  
  next();
};

app.use(performanceMiddleware);

// Mock de autenticación
const mockAuth = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, 'test_secret');
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
  next();
};

// Routes de performance testing
app.post('/api/performance/heavy', mockAuth, async (req, res) => {
  try {
    const { size = 1000 } = req.body;
    const result = await performanceService.heavyOperation(size);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/performance/db-operations', mockAuth, async (req, res) => {
  try {
    const { count = 100 } = req.body;
    const result = await performanceService.simulateDBOperations(count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/performance/external-api', mockAuth, async (req, res) => {
  try {
    const { requests = 50 } = req.body;
    const result = await performanceService.simulateExternalAPI(requests);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/performance/resource-intensive', mockAuth, async (req, res) => {
  try {
    const result = await performanceService.simulateResourceIntensiveTask();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/performance/metrics', mockAuth, (req, res) => {
  try {
    const metrics = performanceService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/performance/reset', mockAuth, (req, res) => {
  try {
    performanceService.clear();
    res.json({ message: 'Métricas reiniciadas' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Endpoint de carga simulada
app.post('/api/load-test', async (req, res) => {
  const { operations = 10 } = req.body;
  
  try {
    const startTime = Date.now();
    
    const loadOperations = Array.from({ length: operations }, async (_, i) => {
      // Simular diferentes tipos de operaciones con diferentes cargas
      const operationType = i % 4;
      
      switch (operationType) {
        case 0:
          // Operación ligera
          await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
          return { type: 'light', id: i, result: 'success' };
        case 1:
          // Operación mediana
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
          return { type: 'medium', id: i, result: 'success' };
        case 2:
          // Operación pesada
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
          return { type: 'heavy', id: i, result: 'success' };
        case 3:
          // Operación con posible fallo
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          if (Math.random() < 0.1) {
            throw new Error(`Operation ${i} failed`);
          }
          return { type: 'risky', id: i, result: 'success' };
        default:
          return { type: 'unknown', id: i, result: 'success' };
      }
    });

    const results = await Promise.allSettled(loadOperations);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({
      totalOperations: operations,
      successful,
      failed,
      duration,
      averageTime: duration / operations,
      successRate: (successful / operations) * 100
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

describe('⚡ Pruebas de Performance y Carga del Sistema', () => {
  const JWT_SECRET = 'test_secret';
  let userToken: string;

  beforeAll(() => {
    userToken = jwt.sign(
      { id: 'user123', email: 'user@test.com', role: 'user' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    // Limpiar métricas antes de cada test
    performanceService.clear();
  });

  describe('🏃‍♂️ Pruebas de Rendimiento Básico', () => {
    test('✅ Should handle heavy computational operations efficiently', async () => {
      const sizes = [100, 500, 1000, 2000];
      
      for (const size of sizes) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/performance/heavy')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ size })
          .expect(200);

        const duration = Date.now() - startTime;
        
        expect(response.body.processedItems).toBeDefined();
        expect(response.body.totalItems).toBe(size);
        expect(response.body.duration).toBeDefined();
        
        // Verificar que el tiempo de respuesta sea razonable
        expect(duration).toBeLessThan(5000); // Menos de 5 segundos
        
        console.log(`✅ Operación pesada (${size} items): ${duration}ms`);
      }
    });

    test('✅ Should maintain performance under database load', async () => {
      const dbOperationCounts = [10, 50, 100, 200];
      
      for (const count of dbOperationCounts) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/performance/db-operations')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ count })
          .expect(200);

        const duration = Date.now() - startTime;
        
        expect(response.body.operations).toBe(count);
        expect(response.body.results).toBe(count);
        expect(response.body.avgLatency).toBeDefined();
        
        // Verificar latencia promedio razonable
        expect(response.body.avgLatency).toBeLessThan(200); // Menos de 200ms promedio
        
        console.log(`✅ Operaciones DB (${count}): ${duration}ms, latencia promedio: ${response.body.avgLatency}ms`);
      }
    });

    test('✅ Should handle external API calls with proper error handling', async () => {
      const requestCounts = [10, 25, 50];
      
      for (const requests of requestCounts) {
        const response = await request(app)
          .post('/api/performance/external-api')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ requests })
          .expect(200);

        expect(response.body.totalRequests).toBe(requests);
        expect(response.body.successful).toBeGreaterThan(0);
        expect(response.body.successRate).toBeGreaterThan(80); // Al menos 80% de éxito
        
        console.log(`✅ API externa (${requests} requests): ${response.body.successRate}% éxito`);
      }
    });
  });

  describe('🔥 Pruebas de Carga Intensiva', () => {
    test('✅ Should handle concurrent heavy operations', async () => {
      const concurrentOperations = 10;
      
      const heavyOps = Array.from({ length: concurrentOperations }, (_, i) =>
        request(app)
          .post('/api/performance/heavy')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ size: 500 + i * 100 })
      );

      const startTime = Date.now();
      const results = await Promise.all(heavyOps);
      const duration = Date.now() - startTime;

      const successfulOps = results.filter(r => r.status === 200);
      expect(successfulOps.length).toBe(concurrentOperations);
      
      // Verificar que el tiempo total no sea excesivo
      expect(duration).toBeLessThan(15000); // Menos de 15 segundos
      
      console.log(`✅ ${concurrentOperations} operaciones pesadas concurrentes: ${duration}ms`);
    });

    test('✅ Should maintain stability under mixed concurrent load', async () => {
      const mixedOperations = [
        // Operaciones pesadas
        ...Array.from({ length: 5 }, () =>
          request(app)
            .post('/api/performance/heavy')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ size: 1000 })
        ),
        // Operaciones de DB
        ...Array.from({ length: 8 }, () =>
          request(app)
            .post('/api/performance/db-operations')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ count: 100 })
        ),
        // Operaciones de API externa
        ...Array.from({ length: 7 }, () =>
          request(app)
            .post('/api/performance/external-api')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ requests: 30 })
        )
      ];

      const startTime = Date.now();
      const results = await Promise.all(mixedOperations);
      const duration = Date.now() - startTime;

      const successfulOps = results.filter(r => r.status === 200);
      const successRate = (successfulOps.length / results.length) * 100;

      expect(successRate).toBeGreaterThan(95); // Al menos 95% de éxito
      expect(duration).toBeLessThan(20000); // Menos de 20 segundos
      
      console.log(`✅ Carga mixta concurrente: ${successRate}% éxito en ${duration}ms`);
    });

    test('✅ Should handle resource-intensive tasks without memory leaks', async () => {
      const iterations = 5;
      const results = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/performance/resource-intensive')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        const duration = Date.now() - startTime;
        
        results.push({
          iteration: i + 1,
          duration,
          memoryUsed: response.body.memoryUsed,
          processedItems: response.body.processedItems
        });

        expect(response.body.processedItems).toBeGreaterThan(0);
        expect(response.body.computationResult).toBeDefined();
        
        // Verificar que el tiempo no aumente significativamente entre iteraciones
        if (i > 0) {
          const timeDifference = Math.abs(duration - results[i - 1].duration);
          expect(timeDifference).toBeLessThan(duration * 0.5); // No más del 50% de diferencia
        }
      }

      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      console.log(`✅ ${iterations} tareas intensivas, promedio: ${avgDuration.toFixed(2)}ms`);
      console.log('Duraciones:', results.map(r => `${r.duration}ms`).join(', '));
    });
  });

  describe('📊 Pruebas de Escalabilidad', () => {
    test('✅ Should scale with increasing load levels', async () => {
      const loadLevels = [10, 50, 100, 200];
      const scalabilityResults: Array<{
        operations: number;
        duration: number;
        successRate: number;
        averageTime: number;
      }> = [];

      for (const operations of loadLevels) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/load-test')
          .send({ operations })
          .expect(200);

        const duration = Date.now() - startTime;
        
        scalabilityResults.push({
          operations,
          duration,
          successRate: response.body.successRate,
          averageTime: response.body.averageTime
        });

        expect(response.body.successRate).toBeGreaterThan(85); // Al menos 85% de éxito
        expect(response.body.successful).toBeGreaterThan(0);
      }

      // Verificar que la escalabilidad sea razonable
      const efficiencyRatios = scalabilityResults.map((result, index) => {
        if (index === 0) return 1;
        
        const prevResult = scalabilityResults[index - 1];
        const loadIncrease = result.operations / prevResult.operations;
        const timeIncrease = result.averageTime / prevResult.averageTime;
        
        return loadIncrease / timeIncrease; // Eficiencia relativa
      });

      // La eficiencia no debería degradarse demasiado
      efficiencyRatios.slice(1).forEach(ratio => {
        expect(ratio).toBeGreaterThan(0.5); // Al menos 50% de eficiencia relativa
      });

      console.log('✅ Resultados de escalabilidad:');
      scalabilityResults.forEach(result => {
        console.log(`  ${result.operations} ops: ${result.duration}ms (${result.successRate}% éxito)`);
      });
    });

    test('✅ Should handle burst traffic effectively', async () => {
      // Simular tráfico en ráfagas
      const burstCount = 3;
      const operationsPerBurst = 50;
      const burstResults = [];

      for (let burst = 0; burst < burstCount; burst++) {
        console.log(`Ejecutando ráfaga ${burst + 1}/${burstCount}...`);
        
        const burstOperations = Array.from({ length: operationsPerBurst }, () =>
          request(app)
            .post('/api/load-test')
            .send({ operations: 20 })
        );

        const startTime = Date.now();
        const results = await Promise.all(burstOperations);
        const duration = Date.now() - startTime;

        const successfulBursts = results.filter(r => r.status === 200);
        const successRate = (successfulBursts.length / results.length) * 100;

        burstResults.push({
          burst: burst + 1,
          duration,
          successRate,
          operations: operationsPerBurst
        });

        expect(successRate).toBeGreaterThan(90); // Al menos 90% de éxito en ráfagas
        
        // Pausa entre ráfagas
        if (burst < burstCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const avgSuccessRate = burstResults.reduce((sum, r) => sum + r.successRate, 0) / burstResults.length;
      expect(avgSuccessRate).toBeGreaterThan(90);

      console.log('✅ Resultados de tráfico en ráfagas:');
      burstResults.forEach(result => {
        console.log(`  Ráfaga ${result.burst}: ${result.duration}ms (${result.successRate}% éxito)`);
      });
    });
  });

  describe('📈 Análisis de Métricas de Performance', () => {
    test('✅ Should provide comprehensive performance metrics', async () => {
      // Generar actividad para obtener métricas
      await request(app)
        .post('/api/performance/heavy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ size: 1000 });

      await request(app)
        .post('/api/performance/db-operations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ count: 50 });

      const metricsResponse = await request(app)
        .get('/api/performance/metrics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const metrics = metricsResponse.body;
      
      expect(metrics.totalOperations).toBeGreaterThan(0);
      expect(metrics.successfulOperations).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.averageDuration).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);

      console.log('✅ Métricas de performance:');
      console.log(`  Operaciones totales: ${metrics.totalOperations}`);
      console.log(`  Tasa de éxito: ${metrics.successRate.toFixed(2)}%`);
      console.log(`  Duración promedio: ${metrics.averageDuration.toFixed(2)}ms`);
      console.log(`  Tasa de error: ${metrics.errorRate.toFixed(2)}%`);
    });

    test('✅ Should track performance trends over time', async () => {
      const performanceRuns = 5;
      const trendData = [];

      for (let run = 0; run < performanceRuns; run++) {
        // Reiniciar métricas para cada run
        await request(app)
          .post('/api/performance/reset')
          .set('Authorization', `Bearer ${userToken}`);

        // Ejecutar operaciones de prueba
        const testOperations = [
          request(app)
            .post('/api/performance/heavy')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ size: 500 }),
          request(app)
            .post('/api/performance/db-operations')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ count: 25 })
        ];

        const startTime = Date.now();
        await Promise.all(testOperations);
        const runDuration = Date.now() - startTime;

        // Obtener métricas del run
        const metricsResponse = await request(app)
          .get('/api/performance/metrics')
          .set('Authorization', `Bearer ${userToken}`);

        trendData.push({
          run: run + 1,
          duration: runDuration,
          successRate: metricsResponse.body.successRate,
          avgDuration: metricsResponse.body.averageDuration
        });
      }

      // Analizar tendencias
      const avgSuccessRate = trendData.reduce((sum, d) => sum + d.successRate, 0) / trendData.length;
      const avgRunDuration = trendData.reduce((sum, d) => sum + d.duration, 0) / trendData.length;

      expect(avgSuccessRate).toBeGreaterThan(95); // Consistencia alta
      
      // Verificar que no hay degradación significativa
      const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
      const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.duration, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.duration, 0) / secondHalf.length;
      
      const degradationRatio = secondHalfAvg / firstHalfAvg;
      expect(degradationRatio).toBeLessThan(1.5); // No más del 50% de degradación

      console.log('✅ Análisis de tendencias de performance:');
      console.log(`  Tasa de éxito promedio: ${avgSuccessRate.toFixed(2)}%`);
      console.log(`  Duración promedio de run: ${avgRunDuration.toFixed(2)}ms`);
      console.log(`  Ratio de degradación: ${degradationRatio.toFixed(2)}`);
    });
  });

  describe('🔄 Pruebas de Recuperación y Resiliencia', () => {
    test('✅ Should recover gracefully from temporary overload', async () => {
      // Fase 1: Crear sobrecarga
      console.log('Creando sobrecarga temporal...');
      
      const overloadOperations = Array.from({ length: 50 }, () =>
        request(app)
          .post('/api/performance/resource-intensive')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const overloadStartTime = Date.now();
      const overloadResults = await Promise.allSettled(overloadOperations);
      const overloadDuration = Date.now() - overloadStartTime;

      const overloadSuccesses = overloadResults.filter(r => r.status === 'fulfilled').length;
      const overloadRate = (overloadSuccesses / overloadResults.length) * 100;

      // Fase 2: Período de recuperación
      console.log('Período de recuperación...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fase 3: Operaciones normales post-recuperación
      const recoveryOperations = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/performance/heavy')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ size: 500 })
      );

      const recoveryStartTime = Date.now();
      const recoveryResults = await Promise.all(recoveryOperations);
      const recoveryDuration = Date.now() - recoveryStartTime;

      const recoverySuccesses = recoveryResults.filter(r => r.status === 200).length;
      const recoveryRate = (recoverySuccesses / recoveryResults.length) * 100;

      // Verificar recuperación
      expect(recoveryRate).toBeGreaterThan(80); // Al menos 80% de éxito post-recuperación
      
      console.log(`✅ Recuperación exitosa:`);
      console.log(`  Sobrecarga: ${overloadRate.toFixed(1)}% éxito en ${overloadDuration}ms`);
      console.log(`  Recuperación: ${recoveryRate.toFixed(1)}% éxito en ${recoveryDuration}ms`);
    }, 90000); // Aumentar timeout a 90 segundos

    test('✅ Should maintain service availability during stress', async () => {
      const stressTestDuration = 10000; // 10 segundos
      const operationInterval = 100; // Una operación cada 100ms
      const results: any[] = [];

      console.log(`Iniciando prueba de estrés por ${stressTestDuration}ms...`);

      const startTime = Date.now();
      
      const stressPromise = new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          if (Date.now() - startTime >= stressTestDuration) {
            clearInterval(interval);
            resolve();
            return;
          }

          try {
            const response = await request(app)
              .post('/api/load-test')
              .send({ operations: 5 })
              .timeout(2000);

            results.push({
              timestamp: Date.now() - startTime,
              status: response.status,
              success: response.status === 200
            });
          } catch (error) {
            results.push({
              timestamp: Date.now() - startTime,
              status: 500,
              success: false,
              error: (error as Error).message
            });
          }
        }, operationInterval);
      });

      await stressPromise;

      const totalOperations = results.length;
      const successfulOperations = results.filter(r => r.success).length;
      const availabilityRate = (successfulOperations / totalOperations) * 100;

      expect(availabilityRate).toBeGreaterThan(85); // Al menos 85% de disponibilidad
      expect(totalOperations).toBeGreaterThan(50); // Al menos 50 operaciones ejecutadas

      console.log(`✅ Prueba de estrés completada:`);
      console.log(`  Operaciones totales: ${totalOperations}`);
      console.log(`  Disponibilidad: ${availabilityRate.toFixed(2)}%`);
      console.log(`  Duración real: ${Date.now() - startTime}ms`);
    });
  });
});