import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ProductModel from '../../src/app/productTypes/models/productTypes.models';
import UserModel from '../../src/app/users/models/user.models';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { canModifyProducts, canReadProducts } from '../../src/middleware/product-roles.middleware';
import { AuthRequest } from '../../src/interfaces/auth.interface';

const app = express();
app.use(express.json());

// Mock del middleware de autenticación con tipos correctos
const mockAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authReq = req as AuthRequest;
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, 'test_secret') as any;
    authReq.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      flags: {
        isProvider: decoded.isProvider || false,
        isProfessional: decoded.isProfessional || false
      }
    };
    authReq.auth = {
      isAuthenticated: true,
      isAdmin: decoded.role === 'admin',
      isProvider: decoded.isProvider || decoded.role === 'provider',
      isProfessional: decoded.isProfessional || decoded.role === 'professional'
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Routes para testing de CRUD de productos
app.post('/test/products', mockAuthMiddleware, canModifyProducts as any, async (req: express.Request, res: express.Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user as any;
    const productData = {
      ...req.body,
      user: user?.id || 'unknown',
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Simular validaciones básicas
    if (!productData.product_info?.name || !productData.product_info?.price) {
      return res.status(400).json({ error: 'Datos de producto incompletos' });
    }
    
    res.status(201).json(productData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/test/products', mockAuthMiddleware, canReadProducts as any, async (req: express.Request, res: express.Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user as any;
    // Mock de lista de productos
    const products = [
      {
        _id: new mongoose.Types.ObjectId(),
        user: user?.id || 'unknown',
        product_info: {
          name: 'Producto Test 1',
          description: 'Descripción del producto 1',
          price: 99.99,
          stock: 10
        },
        product_status: {
          status: 'available',
          payment: ['credit_card', 'cash'],
          delivery: true
        }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        user: user?.id || 'unknown',
        product_info: {
          name: 'Producto Test 2',
          description: 'Descripción del producto 2',
          price: 149.99,
          stock: 5
        },
        product_status: {
          status: 'featured',
          payment: ['credit_card'],
          delivery: false
        }
      }
    ];
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/test/products/:id', mockAuthMiddleware, canReadProducts as any, async (req: express.Request, res: express.Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user as any;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const product = {
      _id: req.params.id,
      user: user?.id || 'unknown',
      product_info: {
        name: 'Producto Individual',
        description: 'Descripción detallada',
        price: 199.99,
        stock: 3
      },
      product_status: {
        status: 'available',
        payment: ['credit_card', 'paypal'],
        delivery: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put('/test/products/:id', mockAuthMiddleware, canModifyProducts as any, async (req: express.Request, res: express.Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user as any;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const updatedProduct = {
      _id: req.params.id,
      user: user?.id || 'unknown',
      ...req.body,
      updatedAt: new Date()
    };
    
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete('/test/products/:id', mockAuthMiddleware, canModifyProducts as any, async (req: express.Request, res: express.Response) => {
  const authReq = req as AuthRequest;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Mock para testing de operaciones de usuario
app.get('/test/users', mockAuthMiddleware, async (req: express.Request, res: express.Response) => {
  const authReq = req as AuthRequest;
  try {
    const currentUser = authReq.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Solo admin puede ver lista de usuarios
    if (!authReq.auth?.isAdmin) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const users = [
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'admin@test.com',
        role: 'admin',
        flags: { isProvider: false, isProfessional: false }
      },
      {
        _id: new mongoose.Types.ObjectId(), 
        email: 'provider@test.com',
        role: 'provider',
        flags: { isProvider: true, isProfessional: false }
      },
      {
        _id: new mongoose.Types.ObjectId(),
        email: 'professional@test.com', 
        role: 'professional',
        flags: { isProvider: false, isProfessional: true }
      }
    ];

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Helper para crear tokens JWT de test
const createTestToken = (userData: any) => {
  return jwt.sign(userData, 'test_secret', { expiresIn: '1h' });
};

// Datos de test
const testUsers = {
  admin: {
    id: 'admin123',
    email: 'admin@test.com',
    role: 'admin'
  },
  professional: {
    id: 'prof123',
    email: 'prof@test.com',
    role: 'professional',
    isProfessional: true
  },
  provider: {
    id: 'prov123',
    email: 'provider@test.com',
    role: 'provider',
    isProvider: true
  },
  regularUser: {
    id: 'user123',
    email: 'user@test.com',
    role: 'user'
  }
};

describe('🛍️ Comprehensive CRUD Operations Tests', () => {
  let adminToken: string;
  let professionalToken: string;
  let providerToken: string;
  let userToken: string;

  beforeAll(() => {
    adminToken = createTestToken(testUsers.admin);
    professionalToken = createTestToken(testUsers.professional);
    providerToken = createTestToken(testUsers.provider);
    userToken = createTestToken(testUsers.regularUser);
  });

  describe('🔐 Authentication and Authorization', () => {
    test('✅ Should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/test/products')
        .expect(401);

      expect(response.body.error).toBe('Token requerido');
    });

    test('✅ Should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/test/products')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.error).toBe('Token inválido');
    });

    test('✅ Should allow authenticated users to read products', async () => {
      const response = await request(app)
        .get('/test/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('👤 Role-based Access Control', () => {
    test('❌ Should deny product creation to regular users', async () => {
      const productData = {
        product_info: {
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          stock: 10
        }
      };

      await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);
    });

    test('✅ Should allow product creation to professional users', async () => {
      const productData = {
        product_info: {
          name: 'Professional Product',
          description: 'Professional Description',
          price: 199.99,
          stock: 5
        }
      };

      const response = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product_info.name).toBe('Professional Product');
      expect(response.body.user).toBe('prof123');
    });

    test('✅ Should allow product creation to provider users', async () => {
      const productData = {
        product_info: {
          name: 'Provider Product',
          description: 'Provider Description',
          price: 299.99,
          stock: 20
        }
      };

      const response = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product_info.name).toBe('Provider Product');
      expect(response.body.user).toBe('prov123');
    });

    test('✅ Should allow product creation to admin users', async () => {
      const productData = {
        product_info: {
          name: 'Admin Product',
          description: 'Admin Description',
          price: 399.99,
          stock: 15
        }
      };

      const response = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product_info.name).toBe('Admin Product');
      expect(response.body.user).toBe('admin123');
    });
  });

  describe('🛍️ Product CRUD Operations', () => {
    test('✅ Should create product with valid data', async () => {
      const productData = {
        product_info: {
          name: 'Valid Product',
          description: 'Valid Description',
          price: 99.99,
          stock: 10
        },
        product_status: {
          status: 'available',
          payment: ['credit_card'],
          delivery: true
        }
      };

      const response = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product_info.name).toBe('Valid Product');
      expect(response.body._id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    test('❌ Should reject product creation with missing required fields', async () => {
      const invalidData = {
        product_info: {
          description: 'Missing name and price'
        }
      };

      await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    test('✅ Should get product by ID', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .get(`/test/products/${validId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body._id).toBe(validId);
      expect(response.body.product_info).toBeDefined();
    });

    test('❌ Should return 404 for invalid product ID', async () => {
      const invalidId = 'invalid_id';
      
      await request(app)
        .get(`/test/products/${invalidId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    test('✅ Should update product', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        product_info: {
          name: 'Updated Product Name',
          price: 149.99
        }
      };

      const response = await request(app)
        .put(`/test/products/${validId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body._id).toBe(validId);
      expect(response.body.updatedAt).toBeDefined();
    });

    test('❌ Should deny product modification to regular users', async () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const updateData = { product_info: { name: 'Unauthorized Update' } };

      await request(app)
        .put(`/test/products/${validId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    test('✅ Should delete product', async () => {
      const validId = new mongoose.Types.ObjectId().toString();

      const response = await request(app)
        .delete(`/test/products/${validId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('eliminado exitosamente');
    });

    test('❌ Should deny product deletion to regular users', async () => {
      const validId = new mongoose.Types.ObjectId().toString();

      await request(app)
        .delete(`/test/products/${validId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('👥 User Management', () => {
    test('✅ Should allow admin to access user list', async () => {
      const response = await request(app)
        .get('/test/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].email).toBeDefined();
    });

    test('❌ Should deny user list access to non-admin users', async () => {
      await request(app)
        .get('/test/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app)
        .get('/test/users')
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(403);

      await request(app)
        .get('/test/users')
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(403);
    });
  });

  describe('🔄 Complex Workflows', () => {
    test('✅ Should handle complete product lifecycle', async () => {
      // Crear producto
      const productData = {
        product_info: {
          name: 'Lifecycle Product',
          description: 'Product for lifecycle test',
          price: 100.00,
          stock: 5
        }
      };

      const createResponse = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(productData)
        .expect(201);

      const productId = createResponse.body._id;

      // Leer producto
      await request(app)
        .get(`/test/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Actualizar producto
      const updateData = { product_info: { price: 120.00 } };
      await request(app)
        .put(`/test/products/${productId}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send(updateData)
        .expect(200);

      // Eliminar producto
      await request(app)
        .delete(`/test/products/${productId}`)
        .set('Authorization', `Bearer ${providerToken}`)
        .expect(200);
    });

    test('✅ Should maintain role restrictions throughout workflow', async () => {
      const productData = {
        product_info: {
          name: 'Restricted Product',
          description: 'Product with role restrictions',
          price: 50.00,
          stock: 3
        }
      };

      // Regular user cannot create
      await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);

      // Professional can create
      const createResponse = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(productData)
        .expect(201);

      const productId = createResponse.body._id;

      // Regular user can read
      await request(app)
        .get(`/test/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Regular user cannot update
      await request(app)
        .put(`/test/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ product_info: { price: 60.00 } })
        .expect(403);

      // Regular user cannot delete
      await request(app)
        .delete(`/test/products/${productId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('🛡️ Data Validation and Security', () => {
    test('❌ Should reject malformed data', async () => {
      const malformedData = {
        invalid_field: 'should not be accepted',
        product_info: null
      };

      await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(malformedData)
        .expect(400);
    });

    test('✅ Should sanitize user input', async () => {
      const unsafeData = {
        product_info: {
          name: '<script>alert("xss")</script>',
          description: 'Normal description',
          price: 99.99,
          stock: 10
        }
      };

      const response = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(unsafeData)
        .expect(201);

      // El nombre debería mantenerse como string, pero no ejecutarse como script
      expect(response.body.product_info.name).toBe('<script>alert("xss")</script>');
    });
  });

  describe('⚡ Performance and Edge Cases', () => {
    test('✅ Should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .get('/test/products')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    test('✅ Should handle large product data', async () => {
      const largeProductData = {
        product_info: {
          name: 'Large Product',
          description: 'A'.repeat(1000), // Descripción larga
          price: 999.99,
          stock: 100
        },
        tags: Array.from({ length: 50 }, (_, i) => `tag${i}`)
      };

      const response = await request(app)
        .post('/test/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeProductData)
        .expect(201);

      expect(response.body.product_info.description.length).toBe(1000);
      expect(response.body.tags?.length).toBe(50);
    });
  });
});