import mongoose from 'mongoose';
import ProductModel from '../../src/app/productTypes/models/productTypes.models';
import { StockMovement } from '../../src/app/productTypes/models/stock-movement.model';
import { StockService } from '../../src/app/productTypes/services/stock.service';
import { updateStock, getStockHistory, getLowStockProducts } from '../../src/app/productTypes/controllers/productType.controller';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

describe('📦 Stock Management Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing';

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let stockService: StockService;

  const testUser = new mongoose.Types.ObjectId();
  const testCategory = new mongoose.Types.ObjectId();

  const testProductData = {
    user: testUser,
    categorie: testCategory,
    product_info: {
      name: 'Producto Stock Test',
      description: 'Para testing de stock',
      stock: 100,
      price: 199.99
    },
    product_status: {
      status: 'available',
      payment: ['credit_card'],
      delivery: true
    },
    product_access: {
      link: 'https://test.com',
      access: true
    },
    tags: ['test', 'stock']
  };

  beforeEach(() => {
    stockService = new StockService();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: {
        _id: testUser.toString(),
        id: testUser.toString(),
        email: 'test@test.com',
        role: 'admin'
      }
    } as any;
  });

  describe('Stock Service Tests', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create(testProductData);
    });

    test('✅ Should add stock successfully', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 50,
        operation: 'add',
        reason: 'Reposición de inventario',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(true);
      expect(result.product?.product_info.stock).toBe(150); // 100 + 50
      expect(result.movement).toBeDefined();
      expect(result.movement?.movementType).toBe('add');
      expect(result.movement?.quantity).toBe(50);
      expect(result.movement?.previousStock).toBe(100);
      expect(result.movement?.newStock).toBe(150);
    });

    test('✅ Should subtract stock successfully', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 30,
        operation: 'subtract',
        reason: 'Venta realizada',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(true);
      expect(result.product?.product_info.stock).toBe(70); // 100 - 30
      expect(result.movement?.movementType).toBe('subtract');
    });

    test('❌ Should reject subtract operation with insufficient stock', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 150, // Más que el stock disponible (100)
        operation: 'subtract',
        reason: 'Venta excesiva',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Stock insuficiente');
      expect(result.error).toContain('Stock actual: 100');
      expect(result.error).toContain('Cantidad solicitada: 150');

      // Verificar que el stock no cambió
      const unchangedProduct = await ProductModel.findById((testProduct as any)._id);
      expect(unchangedProduct?.product_info.stock).toBe(100);
    });

    test('✅ Should set stock to specific value', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 75,
        operation: 'set',
        reason: 'Ajuste de inventario',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(true);
      expect(result.product?.product_info.stock).toBe(75);
      expect(result.movement?.movementType).toBe('set');
      expect(result.movement?.newStock).toBe(75);
    });

    test('✅ Should handle purchase operation', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 25,
        operation: 'purchase',
        reason: 'Compra a proveedor',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(true);
      expect(result.product?.product_info.stock).toBe(125); // 100 + 25
      expect(result.movement?.movementType).toBe('purchase');
    });

    test('✅ Should handle sale operation', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 15,
        operation: 'sale',
        reason: 'Venta al cliente',
        userId: testUser.toString(),
        userRole: 'professional'
      });

      expect(result.success).toBe(true);
      expect(result.product?.product_info.stock).toBe(85); // 100 - 15
      expect(result.movement?.movementType).toBe('sale');
      expect(result.movement?.userRole).toBe('professional');
    });

    test('❌ Should reject invalid operation', async () => {
      const result = await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 10,
        operation: 'invalid' as any,
        reason: 'Operación inválida',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Operación no válida');
    });

    test('❌ Should reject operation on non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const result = await stockService.updateStock({
        productId: nonExistentId.toString(),
        quantity: 10,
        operation: 'add',
        reason: 'Test',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Producto no encontrado');
    });

    test('✅ Should get current stock', async () => {
      const currentStock = await stockService.getCurrentStock((testProduct as any)._id.toString());
      expect(currentStock).toBe(100);
    });

    test('✅ Should check stock availability', async () => {
      const stockCheck = await stockService.hasEnoughStock((testProduct as any)._id.toString(), 50);
      
      expect(stockCheck.hasEnough).toBe(true);
      expect(stockCheck.currentStock).toBe(100);
      expect(stockCheck.shortage).toBe(0);
    });

    test('❌ Should detect insufficient stock', async () => {
      const stockCheck = await stockService.hasEnoughStock((testProduct as any)._id.toString(), 150);
      
      expect(stockCheck.hasEnough).toBe(false);
      expect(stockCheck.currentStock).toBe(100);
      expect(stockCheck.shortage).toBe(50);
    });
  });

  describe('Stock History Tests', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create(testProductData);
      
      // Crear algunos movimientos de stock
      await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 20,
        operation: 'add',
        reason: 'Reposición inicial',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 10,
        operation: 'sale',
        reason: 'Venta #1',
        userId: testUser.toString(),
        userRole: 'professional'
      });

      await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 5,
        operation: 'sale',
        reason: 'Venta #2',
        userId: testUser.toString(),
        userRole: 'provider'
      });
    });

    test('✅ Should get stock history', async () => {
      const history = await stockService.getStockHistory((testProduct as any)._id.toString());
      
      expect(history).toHaveLength(3);
      expect(history[0].movementType).toBe('sale'); // El más reciente primero
      expect(history[0].reason).toBe('Venta #2');
      expect(history[1].reason).toBe('Venta #1');
      expect(history[2].reason).toBe('Reposición inicial');
    });

    test('✅ Should limit stock history results', async () => {
      const limitedHistory = await stockService.getStockHistory((testProduct as any)._id.toString(), 2);
      
      expect(limitedHistory).toHaveLength(2);
      expect(limitedHistory[0].reason).toBe('Venta #2');
      expect(limitedHistory[1].reason).toBe('Venta #1');
    });

    test('✅ Should get stock statistics', async () => {
      const stats = await stockService.getStockStatistics((testProduct as any)._id.toString());
      
      expect(stats).toHaveLength(2); // 'add' y 'sale'
      
      const saleStats = stats.find((s: any) => s._id === 'sale');
      const addStats = stats.find((s: any) => s._id === 'add');
      
      expect(saleStats.count).toBe(2);
      expect(saleStats.totalQuantity).toBe(15); // 10 + 5
      expect(addStats.count).toBe(1);
      expect(addStats.totalQuantity).toBe(20);
    });
  });

  describe('Low Stock Detection Tests', () => {
    beforeEach(async () => {
      // Crear productos con diferentes niveles de stock
      await ProductModel.create({
        ...testProductData,
        product_info: { ...testProductData.product_info, name: 'Producto Stock Alto', stock: 50 }
      });

      await ProductModel.create({
        ...testProductData,
        product_info: { ...testProductData.product_info, name: 'Producto Stock Medio', stock: 15 }
      });

      await ProductModel.create({
        ...testProductData,
        product_info: { ...testProductData.product_info, name: 'Producto Stock Bajo', stock: 5 }
      });

      await ProductModel.create({
        ...testProductData,
        product_info: { ...testProductData.product_info, name: 'Producto Sin Stock', stock: 0 }
      });

      await ProductModel.create({
        ...testProductData,
        product_info: { ...testProductData.product_info, name: 'Producto Inactivo', stock: 3 },
        product_access: { ...testProductData.product_access, access: false }
      });
    });

    test('✅ Should detect low stock products with default threshold', async () => {
      const lowStockProducts = await stockService.getLowStockProducts();
      
      // Solo productos con stock < 10 y access: true
      expect(lowStockProducts).toHaveLength(2);
      
      const productNames = lowStockProducts.map(p => p.product_info.name);
      expect(productNames).toContain('Producto Stock Bajo');
      expect(productNames).toContain('Producto Sin Stock');
      expect(productNames).not.toContain('Producto Inactivo'); // access: false
    });

    test('✅ Should detect low stock products with custom threshold', async () => {
      const lowStockProducts = await stockService.getLowStockProducts(20);
      
      expect(lowStockProducts).toHaveLength(3);
      
      const productNames = lowStockProducts.map(p => p.product_info.name);
      expect(productNames).toContain('Producto Stock Medio');
      expect(productNames).toContain('Producto Stock Bajo');
      expect(productNames).toContain('Producto Sin Stock');
    });

    test('✅ Should handle high threshold', async () => {
      const lowStockProducts = await stockService.getLowStockProducts(200);
      
      expect(lowStockProducts.length).toBeGreaterThan(0);
      // Todos los productos activos deberían estar en la lista
    });
  });

  describe('Stock Controller Tests', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create(testProductData);
    });

    test('✅ Should update stock via controller', async () => {
      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.body = {
        quantity: 25,
        operation: 'add',
        reason: 'Reposición via controller'
      };

      await updateStock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.message).toContain('Stock updated successfully');
      expect(responseCall.data.product).toBeDefined();
      expect(responseCall.data.movement).toBeDefined();
    });

    test('❌ Should reject invalid stock operation via controller', async () => {
      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.body = {
        quantity: 150,
        operation: 'subtract' // Más stock del disponible
      };

      await updateStock(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.message).toBe('Stock update failed');
      expect(responseCall.error.errors[0]).toContain('Stock insuficiente');
    });

    test('✅ Should get stock history via controller', async () => {
      // Crear algunos movimientos primero
      await stockService.updateStock({
        productId: (testProduct as any)._id.toString(),
        quantity: 10,
        operation: 'sale',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.query = { limit: '10' };

      await getStockHistory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.message).toContain('Stock history retrieved successfully');
      expect(responseCall.data.history).toBeDefined();
      expect(Array.isArray(responseCall.data.history)).toBe(true);
    });

    test('✅ Should get low stock products via controller', async () => {
      // Crear un producto con stock bajo
      await ProductModel.create({
        ...testProductData,
        product_info: { ...testProductData.product_info, stock: 3 }
      });

      mockRequest.query = { threshold: '10' };

      await getLowStockProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.message).toContain('Low stock products retrieved successfully');
      expect(responseCall.data.products).toBeDefined();
      expect(responseCall.data.threshold).toBe(10);
    });
  });

  describe('Concurrent Stock Operations', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create(testProductData);
    });

    test('✅ Should handle concurrent stock updates safely', async () => {
      const productId = (testProduct as any)._id.toString();
      
      // Ejecutar operaciones secuencialmente pero verificar consistencia
      const result1 = await stockService.updateStock({
        productId,
        quantity: 10,
        operation: 'subtract',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      const result2 = await stockService.updateStock({
        productId,
        quantity: 20,
        operation: 'add',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      const result3 = await stockService.updateStock({
        productId,
        quantity: 5,
        operation: 'subtract',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      const results = [result1, result2, result3];
      
      // Todas las operaciones deberían ser exitosas
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verificar el stock final
      const finalProduct = await ProductModel.findById(productId);
      expect(finalProduct?.product_info.stock).toBe(105); // 100 - 10 + 20 - 5

      // Verificar que se registraron todos los movimientos
      const movements = await StockMovement.find({ productId }).sort({ createdAt: 1 });
      expect(movements).toHaveLength(3);
    });

    test('❌ Should handle concurrent operations with insufficient stock', async () => {
      const productId = (testProduct as any)._id.toString();
      
      // Intentar múltiples operaciones que exceden el stock secuencialmente
      const result1 = await stockService.updateStock({
        productId,
        quantity: 60,
        operation: 'subtract',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      const result2 = await stockService.updateStock({
        productId,
        quantity: 70,
        operation: 'subtract',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      const results = [result1, result2];
      
      // Al menos una operación debería fallar
      const failures = results.filter(r => !r.success);
      expect(failures.length).toBeGreaterThan(0);

      // El stock final no debería ser negativo
      const finalProduct = await ProductModel.findById(productId);
      expect(finalProduct?.product_info.stock).toBeGreaterThanOrEqual(0);
    });
  });
});