import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Mock de servicios integrales del sistema
class MockIntegratedService {
  private database: Map<string, any> = new Map();
  private subscriptions: Map<string, any> = new Map();
  private orders: Map<string, any> = new Map();
  private payments: Map<string, any> = new Map();
  private notifications: any[] = [];

  // Simulación de operaciones de base de datos
  async createEntity(collection: string, data: any): Promise<any> {
    const id = new mongoose.Types.ObjectId().toString();
    const entity = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    this.database.set(`${collection}:${id}`, entity);
    return entity;
  }

  async findEntity(collection: string, id: string): Promise<any> {
    // Handle specific collections with their own Maps
    switch (collection) {
      case 'subscriptions':
        return this.subscriptions.get(id);
      case 'orders':
        return this.orders.get(id);
      case 'payments':
        return this.payments.get(id);
      default:
        return this.database.get(`${collection}:${id}`);
    }
  }

  async findEntities(collection: string, query: any = {}): Promise<any[]> {
    const entities = [];
    for (const [key, value] of this.database.entries()) {
      if (key.startsWith(`${collection}:`)) {
        entities.push(value);
      }
    }
    return entities;
  }

  async updateEntity(collection: string, id: string, data: any): Promise<any> {
    const key = `${collection}:${id}`;
    const existing = this.database.get(key);
    if (!existing) return null;
    
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.database.set(key, updated);
    return updated;
  }

  async deleteEntity(collection: string, id: string): Promise<boolean> {
    return this.database.delete(`${collection}:${id}`);
  }

  // Simulación de sistema de suscripciones
  async createSubscription(userId: string, planId: string, paymentMethod: string): Promise<any> {
    const subscription = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      planId,
      paymentMethod,
      status: 'active',
      startDate: new Date(),
      nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      amount: planId === 'premium' ? 99.99 : planId === 'basic' ? 19.99 : 49.99
    };
    
    this.subscriptions.set(subscription._id, subscription);
    return subscription;
  }

  async processPayment(subscriptionId: string, amount: number): Promise<any> {
    const payment = {
      _id: new mongoose.Types.ObjectId().toString(),
      subscriptionId,
      amount,
      status: Math.random() > 0.1 ? 'completed' : 'failed', // 90% éxito
      processedAt: new Date(),
      paymentMethod: 'credit_card'
    };
    
    this.payments.set(payment._id, payment);
    return payment;
  }

  // Simulación de sistema de notificaciones
  async sendNotification(userId: string, type: string, message: string): Promise<void> {
    this.notifications.push({
      id: new mongoose.Types.ObjectId().toString(),
      userId,
      type,
      message,
      sentAt: new Date(),
      read: false
    });
  }

  // Simulación de procesamiento de órdenes
  async createOrder(userId: string, items: any[], totalAmount: number): Promise<any> {
    const order = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    };
    
    this.orders.set(order._id, order);
    return order;
  }

  async processOrder(orderId: string): Promise<any> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Orden no encontrada');
    
    // Simular procesamiento
    order.status = Math.random() > 0.05 ? 'processing' : 'failed'; // 95% éxito
    order.processedAt = new Date();
    
    this.orders.set(orderId, order);
    return order;
  }

  // Reportes y analytics
  async generateReport(type: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const report = {
      type,
      dateRange,
      generatedAt: new Date(),
      data: {}
    };

    switch (type) {
      case 'sales':
        report.data = {
          totalRevenue: Math.random() * 100000,
          orderCount: Math.floor(Math.random() * 1000),
          averageOrderValue: Math.random() * 200
        };
        break;
      case 'subscriptions':
        report.data = {
          activeSubscriptions: this.subscriptions.size,
          newSubscriptions: Math.floor(Math.random() * 50),
          churnRate: Math.random() * 0.1
        };
        break;
      case 'users':
        report.data = {
          totalUsers: Math.floor(Math.random() * 10000),
          activeUsers: Math.floor(Math.random() * 5000),
          newRegistrations: Math.floor(Math.random() * 100)
        };
        break;
    }

    return report;
  }

  // Métricas en tiempo real
  getSystemMetrics(): any {
    return {
      timestamp: new Date(),
      database: {
        connections: Math.floor(Math.random() * 50),
        queries: Math.floor(Math.random() * 1000),
        avgResponseTime: Math.random() * 100
      },
      api: {
        requestsPerMinute: Math.floor(Math.random() * 500),
        errorRate: Math.random() * 0.05,
        avgResponseTime: Math.random() * 200
      },
      memory: {
        used: Math.random() * 1024,
        total: 2048,
        percentage: Math.random() * 80
      },
      cpu: {
        usage: Math.random() * 100,
        load: Math.random() * 4
      }
    };
  }
}

const mockService = new MockIntegratedService();

// Mock de autenticación avanzada
const advancedAuth = (requiredRole?: string) => {
  return (req: any, res: any, next: any) => {
    console.log('advancedAuth called for:', req.path, 'with role requirement:', requiredRole);
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);

    const token = authHeader?.replace('Bearer ', '');
    console.log('Token extracted:', token ? 'present' : 'missing');

    if (!token) {
      console.log('No token provided, returning 401');
      return res.status(401).json({ error: 'Token de autenticación requerido' });
    }

    try {
      const decoded = jwt.verify(token, 'test_secret') as any;
      console.log('Token decoded successfully:', { id: decoded.id, email: decoded.email, role: decoded.role });
      req.user = decoded;

      // Verificar rol requerido
      if (requiredRole && decoded.role !== requiredRole) {
        console.log('Role check failed. Required:', requiredRole, 'User has:', decoded.role);
        return res.status(403).json({ error: 'Permisos insuficientes' });
      }

      console.log('Auth successful, calling next()');
      next();
    } catch (error) {
      console.log('Token verification failed:', error);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  };
};

// Routes del sistema integrado
app.post('/api/users', async (req, res) => {
  try {
    const user = await mockService.createEntity('users', req.body);
    await mockService.sendNotification(user._id, 'welcome', 'Bienvenido al sistema');
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/users', advancedAuth('admin'), async (req, res) => {
  try {
    const users = await mockService.findEntities('users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/subscriptions', advancedAuth(), async (req, res) => {
  try {
    const user = req.user as any;
    const { planId, paymentMethod } = req.body;
    const subscription = await mockService.createSubscription(
      user.id, 
      planId, 
      paymentMethod
    );
    
    await mockService.sendNotification(
      user.id, 
      'subscription_created', 
      `Suscripción ${planId} activada correctamente`
    );
    
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/subscriptions/:id/process-payment', advancedAuth(), async (req, res) => {
  console.log('Route /api/subscriptions/:id/process-payment HIT with params:', req.params);
  console.log('User from auth:', req.user);
  try {
    console.log('Route hit with id:', req.params.id);
    const subscription = await mockService.findEntity('subscriptions', req.params.id);
    console.log('Subscription found:', subscription);
    if (!subscription) {
      console.log('Subscription not found, returning 404');
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const payment = await mockService.processPayment(
      subscription._id,
      subscription.amount
    );
    console.log('Payment processed:', payment);

    if (payment.status === 'completed') {
      await mockService.sendNotification(
        subscription.userId,
        'payment_success',
        `Pago de $${payment.amount} procesado correctamente`
      );
    } else {
      await mockService.sendNotification(
        subscription.userId,
        'payment_failed',
        'El pago no pudo ser procesado. Verifica tu método de pago.'
      );
    }

    console.log('Returning payment response');
    res.json(payment);
  } catch (error) {
    console.log('Error in route:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});app.post('/api/orders', advancedAuth(), async (req, res) => {
  try {
    const user = req.user as any;
    const { items } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    );

    const order = await mockService.createOrder(user.id, items, totalAmount);
    
    // Procesar orden automáticamente
    setTimeout(async () => {
      try {
        await mockService.processOrder(order._id);
      } catch (error) {
        console.error('Error procesando orden:', error);
      }
    }, 1000);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/reports/:type', advancedAuth('admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      start: new Date(startDate as string || Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(endDate as string || Date.now())
    };

    const report = await mockService.generateReport(type, dateRange);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/metrics', advancedAuth('admin'), (req, res) => {
  try {
    const metrics = mockService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: 'connected',
      cache: 'connected',
      paymentGateway: 'connected',
      emailService: 'connected'
    },
    version: '1.0.0'
  });
});

describe('🌐 Pruebas de Integración del Sistema Completo', () => {
  const JWT_SECRET = 'test_secret';
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;

  beforeAll(async () => {
    userId = new mongoose.Types.ObjectId().toString();
    adminId = new mongoose.Types.ObjectId().toString();

    userToken = jwt.sign(
      { id: userId, email: 'user@test.com', role: 'user' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminId, email: 'admin@test.com', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('👥 Flujo Completo de Usuario', () => {
    test('✅ Should complete user registration and welcome flow', async () => {
      const userData = {
        primary_data: {
          email: 'newuser@test.com',
          name: 'Usuario Nuevo',
          type: 'user'
        },
        auth_data: {
          password: 'hashedpassword'
        },
        permissions: {
          active: true
        }
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body._id).toBeDefined();
      expect(response.body.primary_data.email).toBe('newuser@test.com');
      expect(response.body.createdAt).toBeDefined();
    });

    test('✅ Should handle user subscription lifecycle', async () => {
      // 1. Crear suscripción
      const subscriptionData = {
        planId: 'premium',
        paymentMethod: 'credit_card'
      };

      const subscriptionResponse = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(subscriptionResponse.body.planId).toBe('premium');
      expect(subscriptionResponse.body.status).toBe('active');
      expect(subscriptionResponse.body.amount).toBe(99.99);

      // 2. Procesar pago de suscripción
      const paymentResponse = await request(app)
        .post(`/api/subscriptions/${subscriptionResponse.body._id}/process-payment`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(paymentResponse.body.subscriptionId).toBe(subscriptionResponse.body._id);
      expect(['completed', 'failed']).toContain(paymentResponse.body.status);
    });

    test('✅ Should process complete order workflow', async () => {
      const orderData = {
        items: [
          { productId: 'prod1', name: 'Producto 1', price: 29.99, quantity: 2 },
          { productId: 'prod2', name: 'Producto 2', price: 49.99, quantity: 1 }
        ]
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(orderResponse.body.totalAmount).toBe(109.97); // (29.99 * 2) + 49.99
      expect(orderResponse.body.status).toBe('pending');
      expect(orderResponse.body.items.length).toBe(2);

      // Esperar procesamiento automático
      await new Promise(resolve => setTimeout(resolve, 1500));
    });
  });

  describe('📊 Funcionalidades Administrativas', () => {
    test('✅ Should access admin endpoints with proper authentication', async () => {
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(usersResponse.body)).toBe(true);
    });

    test('❌ Should deny admin access to regular users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('✅ Should generate sales reports', async () => {
      const reportResponse = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
        .expect(200);

      expect(reportResponse.body.type).toBe('sales');
      expect(reportResponse.body.data.totalRevenue).toBeDefined();
      expect(reportResponse.body.data.orderCount).toBeDefined();
      expect(reportResponse.body.generatedAt).toBeDefined();
    });

    test('✅ Should generate subscription reports', async () => {
      const reportResponse = await request(app)
        .get('/api/reports/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(reportResponse.body.type).toBe('subscriptions');
      expect(reportResponse.body.data.activeSubscriptions).toBeDefined();
      expect(reportResponse.body.data.newSubscriptions).toBeDefined();
      expect(reportResponse.body.data.churnRate).toBeDefined();
    });

    test('✅ Should access system metrics', async () => {
      const metricsResponse = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(metricsResponse.body.database).toBeDefined();
      expect(metricsResponse.body.api).toBeDefined();
      expect(metricsResponse.body.memory).toBeDefined();
      expect(metricsResponse.body.cpu).toBeDefined();
      expect(metricsResponse.body.timestamp).toBeDefined();
    });
  });

  describe('💳 Flujos de Pago Integrados', () => {
    test('✅ Should handle multiple subscription types', async () => {
      const plans = ['basic', 'standard', 'premium'];
      const expectedAmounts = [19.99, 49.99, 99.99];

      for (let i = 0; i < plans.length; i++) {
        const response = await request(app)
          .post('/api/subscriptions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            planId: plans[i],
            paymentMethod: 'credit_card'
          })
          .expect(201);

        expect(response.body.planId).toBe(plans[i]);
        expect(response.body.amount).toBe(expectedAmounts[i]);
      }
    });

    test('✅ Should handle payment failures gracefully', async () => {
      // Crear múltiples intentos de pago para simular fallos
      const paymentAttempts = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/subscriptions')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            planId: 'basic',
            paymentMethod: 'credit_card'
          })
          .then(res => 
            request(app)
              .post(`/api/subscriptions/${res.body._id}/process-payment`)
              .set('Authorization', `Bearer ${userToken}`)
          )
      );

      const results = await Promise.all(paymentAttempts);
      
      const successful = results.filter(r => r.body.status === 'completed');
      const failed = results.filter(r => r.body.status === 'failed');

      expect(successful.length + failed.length).toBe(10);
      expect(successful.length).toBeGreaterThan(0); // Al menos algunos exitosos
      
      console.log(`✅ Pagos procesados: ${successful.length} exitosos, ${failed.length} fallidos`);
    });
  });

  describe('🔄 Pruebas de Resiliencia y Recuperación', () => {
    test('✅ Should handle concurrent user operations', async () => {
      const concurrentOps = Array.from({ length: 20 }, (_, i) => {
        if (i % 3 === 0) {
          // Crear usuario
          return request(app)
            .post('/api/users')
            .send({
              primary_data: {
                email: `concurrent${i}@test.com`,
                name: `Usuario Concurrente ${i}`,
                type: 'user'
              },
              auth_data: { password: 'password' }
            });
        } else if (i % 3 === 1) {
          // Crear suscripción
          return request(app)
            .post('/api/subscriptions')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              planId: 'basic',
              paymentMethod: 'credit_card'
            });
        } else {
          // Crear orden
          return request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              items: [
                { productId: `prod${i}`, name: `Producto ${i}`, price: 10 + i, quantity: 1 }
              ]
            });
        }
      });

      const startTime = Date.now();
      const results = await Promise.all(concurrentOps);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status < 400).length;
      const successRate = successCount / results.length;

      expect(successRate).toBeGreaterThan(0.8); // Al menos 80% de éxito
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos

      console.log(`✅ Operaciones concurrentes: ${successCount}/${results.length} exitosas en ${duration}ms`);
    });

    test('✅ Should maintain data consistency under load', async () => {
      // Crear múltiples usuarios y verificar que los datos se mantienen consistentes
      const userCreations = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/api/users')
          .send({
            primary_data: {
              email: `consistency${i}@test.com`,
              name: `Usuario Consistencia ${i}`,
              type: 'user'
            },
            auth_data: { password: 'password' },
            testId: i
          })
      );

      const createdUsers = await Promise.all(userCreations);
      
      // Verificar que todos los usuarios fueron creados correctamente
      createdUsers.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.primary_data.email).toBe(`consistency${index}@test.com`);
        expect(response.body._id).toBeDefined();
        expect(response.body.createdAt).toBeDefined();
      });

      // Verificar mediante endpoint de admin que todos los usuarios existen
      const allUsersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(allUsersResponse.body.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('🏥 Health Checks y Monitoreo', () => {
    test('✅ Should provide comprehensive health status', async () => {
      const healthResponse = await request(app)
        .get('/api/health')
        .expect(200);

      expect(healthResponse.body.status).toBe('healthy');
      expect(healthResponse.body.services.database).toBe('connected');
      expect(healthResponse.body.services.cache).toBe('connected');
      expect(healthResponse.body.services.paymentGateway).toBe('connected');
      expect(healthResponse.body.services.emailService).toBe('connected');
      expect(healthResponse.body.version).toBeDefined();
    });

    test('✅ Should provide real-time system metrics', async () => {
      const metricsResponse = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const metrics = metricsResponse.body;
      
      // Verificar estructura de métricas
      expect(metrics.database.connections).toBeGreaterThanOrEqual(0);
      expect(metrics.api.requestsPerMinute).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.used).toBeGreaterThanOrEqual(0);
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      
      // Verificar rangos razonables
      expect(metrics.memory.percentage).toBeLessThanOrEqual(100);
      expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
      expect(metrics.api.errorRate).toBeLessThanOrEqual(1);
    });
  });

  describe('📈 Análisis de Performance y Escalabilidad', () => {
    test('✅ Should handle high-volume report generation', async () => {
      const reportTypes = ['sales', 'subscriptions', 'users'];
      
      const reportPromises = reportTypes.map(type =>
        request(app)
          .get(`/api/reports/${type}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .query({
            startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          })
      );

      const startTime = Date.now();
      const reports = await Promise.all(reportPromises);
      const duration = Date.now() - startTime;

      reports.forEach((report, index) => {
        expect(report.status).toBe(200);
        expect(report.body.type).toBe(reportTypes[index]);
        expect(report.body.data).toBeDefined();
        expect(report.body.generatedAt).toBeDefined();
      });

      expect(duration).toBeLessThan(3000); // Menos de 3 segundos para todos los reportes
      
      console.log(`✅ ${reportTypes.length} reportes generados en ${duration}ms`);
    });

    test('✅ Should maintain response times under mixed load', async () => {
      const mixedOperations = [
        // Operaciones ligeras
        ...Array.from({ length: 10 }, () => () => request(app).get('/api/health')),
        
        // Operaciones medianas
        ...Array.from({ length: 5 }, () => () => 
          request(app)
            .get('/api/metrics')
            .set('Authorization', `Bearer ${adminToken}`)
        ),
        
        // Operaciones pesadas
        ...Array.from({ length: 3 }, () => () =>
          request(app)
            .get('/api/reports/sales')
            .set('Authorization', `Bearer ${adminToken}`)
        ),
        
        // Operaciones de escritura
        ...Array.from({ length: 7 }, (_, i) => () =>
          request(app)
            .post('/api/users')
            .send({
              primary_data: {
                email: `mixedload${i}@test.com`,
                name: `Usuario Mixed Load ${i}`,
                type: 'user'
              },
              auth_data: { password: 'password' }
            })
        )
      ];

      // Shufflar operaciones para simular carga real
      const shuffledOps = mixedOperations.sort(() => Math.random() - 0.5);
      
      const startTime = Date.now();
      const results = await Promise.all(shuffledOps.map(op => op()));
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status < 400).length;
      const averageResponseTime = duration / results.length;

      expect(successCount).toBe(results.length); // Todas exitosas
      expect(averageResponseTime).toBeLessThan(500); // Menos de 500ms promedio

      console.log(`✅ Carga mixta: ${results.length} operaciones, promedio ${averageResponseTime.toFixed(2)}ms`);
    });
  });

  describe('🔄 Flujos de Integración End-to-End', () => {
    test('✅ Should complete full business workflow', async () => {
      // 1. Registrar nuevo usuario
      const userResponse = await request(app)
        .post('/api/users')
        .send({
          primary_data: {
            email: 'fullworkflow@test.com',
            name: 'Usuario Workflow Completo',
            type: 'user'
          },
          auth_data: { password: 'password' },
          permissions: { active: true }
        })
        .expect(201);

      const newUserId = userResponse.body._id;

      // 2. Crear token para el nuevo usuario
      const newUserToken = jwt.sign(
        { id: newUserId, email: 'fullworkflow@test.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // 3. Crear suscripción premium
      const subscriptionResponse = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          planId: 'premium',
          paymentMethod: 'credit_card'
        })
        .expect(201);

      // 4. Procesar pago inicial
      const paymentResponse = await request(app)
        .post(`/api/subscriptions/${subscriptionResponse.body._id}/process-payment`)
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      // 5. Crear orden de productos
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send({
          items: [
            { productId: 'premium1', name: 'Producto Premium 1', price: 199.99, quantity: 1 },
            { productId: 'premium2', name: 'Producto Premium 2', price: 299.99, quantity: 2 }
          ]
        })
        .expect(201);

      // 6. Generar reporte administrativo incluyendo nueva actividad
      const salesReportResponse = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const subscriptionReportResponse = await request(app)
        .get('/api/reports/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verificar todo el flujo
      expect(userResponse.body.primary_data.email).toBe('fullworkflow@test.com');
      expect(subscriptionResponse.body.planId).toBe('premium');
      expect(subscriptionResponse.body.status).toBe('active');
      expect(['completed', 'failed']).toContain(paymentResponse.body.status);
      expect(orderResponse.body.totalAmount).toBe(799.97); // 199.99 + (299.99 * 2)
      expect(salesReportResponse.body.type).toBe('sales');
      expect(subscriptionReportResponse.body.type).toBe('subscriptions');

      console.log('✅ Flujo completo de negocio ejecutado exitosamente');
    });
  });
});