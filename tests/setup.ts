import mongoose from 'mongoose';
import { initializeModels } from '../src/config/models.config';

beforeAll(async () => {
  // Variables de entorno para testing
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
  process.env.JWT_KEY = 'test_jwt_secret_key_for_testing';
  process.env.NODE_ENV = 'test';

  // Inicializar modelos de Mongoose
  initializeModels();
  
  // Conectar a una base de datos de test (configurar según tu entorno)
  const testDbUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/test_lv_backend';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  // Limpiar después de todos los tests
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});

beforeEach(async () => {
  // Limpiar todas las colecciones antes de cada test
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Mock de console para evitar spam en tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};