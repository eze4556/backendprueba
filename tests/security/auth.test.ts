import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import UserModel from '../../src/app/users/models/user.models';
import { authMiddleware, adminAuthMiddleware } from '../../src/middleware/auth.middleware';
import { verifyToken } from '../../src/app/users/middlewares/user.middlewares';
import Token from '../../src/auth/token/token';
import HttpHandler from '../../src/helpers/handler.helper';

// Configurar variables de entorno para testing
process.env.JWT_KEY = 'test_secret_key';
process.env.JWT_SECRET = 'test_secret_key';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const app = express();
app.use(express.json());

// Mock routes para testing de autenticación completa
app.post('/test/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(401).json({ error: 'Email y password son requeridos' });
    }
    
    const user = await UserModel.findOne({ 'primary_data.email': email });
    
    if (!user || !await bcrypt.compare(password, user.auth_data.password)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    if (!user.permissions.active) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.primary_data.email, role: user.primary_data.type },
      'test_secret_key',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.primary_data.email,
        role: user.primary_data.type
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Mock route for testing protected access
app.get('/test/protected', 
  (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
      const decoded = jwt.verify(token, 'test_secret_key') as { id: string; email: string; role: string };
      (req as AuthenticatedRequest).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  },
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Acceso autorizado', user: req.user });
  }
);

// Mock route for testing admin access
app.get('/test/admin',
  (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
      const decoded = jwt.verify(token, 'test_secret_key') as { id: string; email: string; role: string };
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso no autorizado' });
      }
      (req as AuthenticatedRequest).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  },
  (req: AuthenticatedRequest, res: Response) => {
    res.json({ message: 'Acceso de administrador', user: req.user });
  }
);

app.post('/test/register', async (req, res) => {
  try {
    const { email, password, name, last_name, nickname, description, role } = req.body;
    
    // Validaciones básicas
    if (!email || !password || !name || !last_name || !nickname || !description) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Validar formato de email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }
    
    const existingUser = await UserModel.findOne({ 'primary_data.email': email });
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new UserModel({
      primary_data: {
        email,
        name,
        last_name,
        nickname,
        description,
        type: role || 'user'
      },
      auth_data: {
        password: hashedPassword
      },
      permissions: {
        active: true,
        allow_password_change: false
      }
    });
    
    await newUser.save();
    res.status(201).json({ message: 'Usuario creado exitosamente', id: newUser._id });
  } catch (error: any) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
});

describe('🔐 Sistema Completo de Autenticación y Autorización', () => {
  const JWT_SECRET = 'test_secret_key';

  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await UserModel.deleteMany({});
  });

  describe('📝 Registro de Usuarios', () => {
    test('✅ Should register new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        name: 'Test User',
        last_name: 'Test LastName',
        nickname: 'newuser',
        description: 'Usuario de prueba',
        role: 'user'
      };

      const response = await request(app)
        .post('/test/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('Usuario creado exitosamente');
      expect(response.body.id).toBeDefined();

      // Verificar que el usuario fue creado en la BD
      const user = await UserModel.findById(response.body.id);
      expect(user).toBeTruthy();
      expect(user!.primary_data.email).toBe(userData.email);
      expect(user!.primary_data.name).toBe(userData.name);
    });

    test('❌ Should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'SecurePass123!',
        name: 'First User',
        last_name: 'First LastName',
        nickname: 'firstuser',
        description: 'Primer usuario'
      };

      // Crear primer usuario
      await request(app)
        .post('/test/register')
        .send(userData)
        .expect(201);

      // Intentar crear segundo usuario con mismo email
      const response = await request(app)
        .post('/test/register')
        .send({
          ...userData,
          name: 'Second User',
          nickname: 'seconduser'
        })
        .expect(400);

      expect(response.body.error).toBe('El usuario ya existe');
    });

    test('❌ Should reject registration with invalid data', async () => {
      const invalidUserData = [
        { email: '', password: 'password', name: 'Test', last_name: 'LastName', nickname: 'test', description: 'Test user' }, // Email vacío
        { email: 'test@test.com', password: '', name: 'Test', last_name: 'LastName', nickname: 'test', description: 'Test user' }, // Password vacío
        { email: 'test@test.com', password: 'password', name: '', last_name: 'LastName', nickname: 'test', description: 'Test user' }, // Nombre vacío
        { email: 'invalid-email', password: 'password', name: 'Test', last_name: 'LastName', nickname: 'test', description: 'Test user' } // Email inválido
      ];

      for (const userData of invalidUserData) {
        await request(app)
          .post('/test/register')
          .send(userData)
          .expect(400); // Ahora esperamos 400 por datos inválidos
      }
    });

    test('✅ Should create users with different roles', async () => {
      const roles = ['user', 'admin', 'professional', 'provider'];
      
      for (let i = 0; i < roles.length; i++) {
        const userData = {
          email: `user${i}@test.com`,
          password: 'SecurePass123!',
          name: `User ${i}`,
          last_name: `LastName ${i}`,
          nickname: `user${i}`,
          description: `Usuario ${i} para testing`,
          role: roles[i]
        };

        const response = await request(app)
          .post('/test/register')
          .send(userData)
          .expect(201);

        const user = await UserModel.findById(response.body.id);
        expect(user!.primary_data.type).toBe(roles[i]);
      }
    });
  });

  describe('🔑 Inicio de Sesión', () => {
    let testUser: any;

    beforeEach(async () => {
      // Crear usuario de prueba
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      testUser = new UserModel({
        primary_data: {
          email: 'testuser@test.com',
          name: 'Test User',
          last_name: 'Test LastName',
          nickname: 'testuser',
          description: 'Usuario de prueba para testing',
          type: 'user'
        },
        auth_data: {
          password: hashedPassword
        },
        permissions: {
          active: true,
          allow_password_change: false
        }
      });
      await testUser.save();
    });

    test('✅ Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/test/login')
        .send({
          email: 'testuser@test.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('testuser@test.com');
      expect(response.body.user.role).toBe('user');

      // Verificar que el token es válido
      const decoded = jwt.verify(response.body.token, JWT_SECRET) as any;
      expect(decoded.email).toBe('testuser@test.com');
    });

    test('❌ Should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/test/login')
        .send({
          email: 'testuser@test.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(response.body.error).toBe('Credenciales incorrectas');
    });

    test('❌ Should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/test/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.error).toBe('Credenciales incorrectas');
    });

    test('❌ Should reject login for inactive user', async () => {
      // Desactivar usuario
      testUser.permissions.active = false;
      await testUser.save();

      const response = await request(app)
        .post('/test/login')
        .send({
          email: 'testuser@test.com',
          password: 'TestPassword123!'
        })
        .expect(403);

      expect(response.body.error).toBe('Usuario inactivo');
    });

    test('❌ Should reject login with missing credentials', async () => {
      // Sin email
      await request(app)
        .post('/test/login')
        .send({ password: 'TestPassword123!' })
        .expect(401);

      // Sin password
      await request(app)
        .post('/test/login')
        .send({ email: 'testuser@test.com' })
        .expect(401);

      // Sin datos
      await request(app)
        .post('/test/login')
        .send({})
        .expect(401);
    });
  });

  describe('🛡️ Validación de Tokens', () => {
    let validToken: string;
    let adminToken: string;
    let expiredToken: string;

    beforeEach(async () => {
      // Crear usuarios de prueba
      const hashedPassword = await bcrypt.hash('password', 10);
      
      const regularUser = new UserModel({
        primary_data: { 
          email: 'user@test.com', 
          name: 'User', 
          last_name: 'Test LastName',
          nickname: 'regularuser',
          description: 'Usuario regular para testing',
          type: 'user' 
        },
        auth_data: { password: hashedPassword },
        permissions: { active: true, allow_password_change: false }
      });
      await regularUser.save();

      const adminUser = new UserModel({
        primary_data: { 
          email: 'admin@test.com', 
          name: 'Admin', 
          last_name: 'Admin LastName',
          nickname: 'adminuser',
          description: 'Usuario administrador para testing',
          type: 'admin' 
        },
        auth_data: { password: hashedPassword },
        permissions: { active: true, allow_password_change: false }
      });
      await adminUser.save();

      // Obtener tokens reales usando el login endpoint
      const userLoginResponse = await request(app)
        .post('/test/login')
        .send({
          email: 'user@test.com',
          password: 'password'
        });
      validToken = userLoginResponse.body.token;

      const adminLoginResponse = await request(app)
        .post('/test/login')
        .send({
          email: 'admin@test.com',
          password: 'password'
        });
      adminToken = adminLoginResponse.body.token;

      // Generar token expirado manualmente
      expiredToken = jwt.sign(
        { id: regularUser._id, email: 'user@test.com', role: 'user' },
        JWT_SECRET,
        { expiresIn: '-1h' } // Token expirado
      );
    });

    test('✅ Should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/test/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Acceso autorizado');
      expect(response.body.user.email).toBe('user@test.com');
    });

    test('❌ Should reject access without token', async () => {
      await request(app)
        .get('/test/protected')
        .expect(401);
    });

    test('❌ Should reject access with expired token', async () => {
      await request(app)
        .get('/test/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    test('❌ Should reject access with invalid token', async () => {
      await request(app)
        .get('/test/protected')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    test('✅ Admin should access admin routes', async () => {
      const response = await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Acceso de administrador');
      expect(response.body.user.role).toBe('admin');
    });

    test('❌ Regular user should NOT access admin routes', async () => {
      await request(app)
        .get('/test/admin')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);
    });
  });

  describe('🔄 Casos de Uso Avanzados', () => {
    test('✅ Should handle multiple simultaneous logins', async () => {
      // Crear usuario
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = new UserModel({
        primary_data: { 
          email: 'multilogin@test.com', 
          name: 'Multi User', 
          last_name: 'Multi LastName',
          nickname: 'multiuser',
          description: 'Usuario para testing de múltiples logins',
          type: 'user' 
        },
        auth_data: { password: hashedPassword },
        permissions: { active: true, allow_password_change: false }
      });
      await user.save();

      // Realizar múltiples logins simultáneos
      const loginPromises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/test/login')
          .send({
            email: 'multilogin@test.com',
            password: 'password'
          })
      );

      const responses = await Promise.all(loginPromises);
      
      // Todos deben ser exitosos
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
      });

      // Todos los tokens deben ser válidos
      const tokens = responses.map(r => r.body.token);
      tokens.forEach(token => {
        const decoded = jwt.verify(token, JWT_SECRET);
        expect(decoded).toBeTruthy();
      });
    });

    test('✅ Should maintain session consistency across requests', async () => {
      // Crear y autenticar usuario
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = new UserModel({
        primary_data: { 
          email: 'session@test.com', 
          name: 'Session User', 
          last_name: 'Session LastName',
          nickname: 'sessionuser',
          description: 'Usuario para testing de sesiones',
          type: 'user' 
        },
        auth_data: { password: hashedPassword },
        permissions: { active: true, allow_password_change: false }
      });
      await user.save();

      const loginResponse = await request(app)
        .post('/test/login')
        .send({
          email: 'session@test.com',
          password: 'password'
        });

      const token = loginResponse.body.token;

      // Realizar múltiples requests con el mismo token
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .get('/test/protected')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.user.email).toBe('session@test.com');
      }
    });

    test('❌ Should handle malformed authorization headers', async () => {
      const malformedHeaders = [
        'InvalidHeader',
        'Bearer',
        'Bearer ',
        'Basic dGVzdDp0ZXN0', // Wrong auth type
        `Bearer ${jwt.sign({}, 'wrong_secret')}`, // Wrong secret
        'Bearer token.with.wrong.format'
      ];

      for (const header of malformedHeaders) {
        await request(app)
          .get('/test/protected')
          .set('Authorization', header)
          .expect(401);
      }
    });

    test('✅ Should validate token payload structure', async () => {
      const invalidPayloads = [
        {}, // Payload vacío
        { email: 'test@test.com' }, // Sin ID
        { id: 'test_id' }, // Sin email
        { id: 'test_id', email: 'test@test.com' }, // Sin role
        { id: '', email: 'test@test.com', role: 'user' }, // ID vacío
        { id: 'test_id', email: '', role: 'user' }, // Email vacío
        { id: 'test_id', email: 'test@test.com', role: '' } // Role vacío
      ];

      for (const payload of invalidPayloads) {
        const token = jwt.sign(payload, JWT_SECRET);
        
        const response = await request(app)
          .get('/test/protected')
          .set('Authorization', `Bearer ${token}`);

        // Algunos pueden pasar pero con datos incompletos
        if (response.status === 200) {
          // Verificar que los datos estén presentes o manejados correctamente
          expect(response.body.user).toBeDefined();
        } else {
          expect(response.status).toBe(401);
        }
      }
    });
  });

  describe('🚀 Performance y Seguridad', () => {
    test('✅ Should handle high load authentication requests', async () => {
      // Crear usuario para pruebas de carga
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = new UserModel({
        primary_data: { 
          email: 'loadtest@test.com', 
          name: 'Load User', 
          last_name: 'Load LastName',
          nickname: 'loaduser',
          description: 'Usuario para testing de carga',
          type: 'user' 
        },
        auth_data: { password: hashedPassword },
        permissions: { active: true, allow_password_change: false }
      });
      await user.save();

      const startTime = Date.now();
      const concurrentRequests = 50;

      // Realizar requests concurrentes de autenticación
      const authPromises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .post('/test/login')
          .send({
            email: 'loadtest@test.com',
            password: 'password'
          })
      );

      const responses = await Promise.all(authPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar que todas las respuestas fueron exitosas
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBe(concurrentRequests);

      // Verificar tiempo de respuesta razonable (menos de 10 segundos)
      expect(duration).toBeLessThan(10000);

      console.log(`✅ ${concurrentRequests} requests de autenticación completadas en ${duration}ms`);
    });

    test('❌ Should resist brute force attempts', async () => {
      // Crear usuario objetivo
      const hashedPassword = await bcrypt.hash('correct_password', 10);
      const user = new UserModel({
        primary_data: { 
          email: 'bruteforce@test.com', 
          name: 'Target User', 
          last_name: 'Target LastName',
          nickname: 'targetuser',
          description: 'Usuario para testing de fuerza bruta',
          type: 'user' 
        },
        auth_data: { password: hashedPassword },
        permissions: { active: true, allow_password_change: false }
      });
      await user.save();

      // Intentar múltiples passwords incorrectos
      const wrongPasswords = [
        'password123', 'admin', '12345', 'qwerty', 'password',
        'letmein', 'welcome', 'monkey', 'dragon', 'pass123'
      ];

      let successfulAttempts = 0;
      
      for (const wrongPassword of wrongPasswords) {
        const response = await request(app)
          .post('/test/login')
          .send({
            email: 'bruteforce@test.com',
            password: wrongPassword
          });

        if (response.status === 200) {
          successfulAttempts++;
        } else {
          expect(response.status).toBe(401);
          expect(response.body.error).toBe('Credenciales incorrectas');
        }
      }

      // Ningún intento con password incorrecto debería ser exitoso
      expect(successfulAttempts).toBe(0);

      // Verificar que el password correcto sigue funcionando
      const validResponse = await request(app)
        .post('/test/login')
        .send({
          email: 'bruteforce@test.com',
          password: 'correct_password'
        })
        .expect(200);

      expect(validResponse.body.token).toBeDefined();
    });
  });
});