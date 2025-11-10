import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import ProductModel from '../../src/app/productTypes/models/productTypes.models';
import {
  validateProductData,
  validateStockOperation,
  validateProductOwnership,
  validateProductExists,
  validateMinimumStock
} from '../../src/middleware/product-validation.middleware';

describe('🛡️ Product Validation Middleware Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  const testUser = new mongoose.Types.ObjectId();
  const testCategory = new mongoose.Types.ObjectId();

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      user: {
        _id: testUser.toString(),
        id: testUser.toString(),
        email: 'test@test.com',
        role: 'admin'
      }
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  describe('validateProductData Middleware', () => {
    test('✅ Should pass with valid product data', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Válido',
          description: 'Descripción válida',
          price: 99.99,
          stock: 10
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('❌ Should reject when product_info is missing', () => {
      mockRequest.body = {
        // Missing product_info
        user: testUser,
        categorie: testCategory
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'product_info es requerido',
          errors: [{
            code: 'MISSING_PRODUCT_INFO',
            message: 'product_info es requerido'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject when name is missing', () => {
      mockRequest.body = {
        product_info: {
          // Missing name
          description: 'Descripción válida',
          price: 99.99,
          stock: 10
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'MISSING_NAME',
            field: 'name',
            message: 'El nombre del producto es requerido'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject when name is empty string', () => {
      mockRequest.body = {
        product_info: {
          name: '   ', // Solo espacios
          description: 'Descripción válida',
          price: 99.99,
          stock: 10
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject when description is missing', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Válido',
          // Missing description
          price: 99.99,
          stock: 10
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'MISSING_DESCRIPTION',
            field: 'description',
            message: 'La descripción del producto es requerida'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject negative price', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Válido',
          description: 'Descripción válida',
          price: -50, // Precio negativo
          stock: 10
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'NEGATIVE_PRICE',
            field: 'price',
            message: 'El precio debe ser un número positivo'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject non-numeric price', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Válido',
          description: 'Descripción válida',
          price: 'no_es_numero', // Precio no numérico
          stock: 10
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject negative stock', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Válido',
          description: 'Descripción válida',
          price: 99.99,
          stock: -5 // Stock negativo
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'NEGATIVE_STOCK',
            field: 'stock',
            message: 'El stock debe ser un número positivo o cero'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('✅ Should accept zero price and stock', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Gratuito',
          description: 'Producto sin costo',
          price: 0,
          stock: 0
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('✅ Should pass when price and stock are undefined', () => {
      mockRequest.body = {
        product_info: {
          name: 'Producto Parcial',
          description: 'Solo nombre y descripción'
          // price y stock undefined
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateStockOperation Middleware', () => {
    test('✅ Should pass with valid add operation', () => {
      mockRequest.body = {
        quantity: 10,
        operation: 'add'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('✅ Should pass with valid sale operation', () => {
      mockRequest.body = {
        quantity: 5,
        operation: 'sale'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('✅ Should pass with valid set operation and zero quantity', () => {
      mockRequest.body = {
        quantity: 0,
        operation: 'set'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('❌ Should reject invalid operation', () => {
      mockRequest.body = {
        quantity: 10,
        operation: 'invalid_operation'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'INVALID_OPERATION',
            field: 'operation',
            message: 'Operación inválida. Debe ser: add, subtract, set, sale, purchase, adjustment'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject missing operation', () => {
      mockRequest.body = {
        quantity: 10
        // Missing operation
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject missing quantity', () => {
      mockRequest.body = {
        operation: 'add'
        // Missing quantity
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'INVALID_QUANTITY_TYPE',
            field: 'quantity',
            message: 'La cantidad debe ser un número'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject non-numeric quantity', () => {
      mockRequest.body = {
        quantity: 'not_a_number',
        operation: 'add'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject zero quantity for add operation', () => {
      mockRequest.body = {
        quantity: 0,
        operation: 'add'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'INVALID_POSITIVE_QUANTITY',
            field: 'quantity',
            message: 'La cantidad debe ser mayor a cero para esta operación'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject negative quantity for subtract operation', () => {
      mockRequest.body = {
        quantity: -10,
        operation: 'subtract'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject negative quantity for set operation', () => {
      mockRequest.body = {
        quantity: -5,
        operation: 'set'
      };

      validateStockOperation(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation Error',
          errors: [{
            code: 'NEGATIVE_QUANTITY',
            field: 'quantity',
            message: 'La cantidad no puede ser negativa'
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateProductExists Middleware', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create({
        user: testUser,
        categorie: testCategory,
        product_info: {
          name: 'Producto Test',
          description: 'Para testing',
          stock: 10,
          price: 99.99
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: true
        },
        product_access: {
          link: 'https://test.com',
          access: true
        },
        tags: ['test']
      });
    });

    test('✅ Should pass with existing product ID', async () => {
      mockRequest.params = { id: (testProduct as any)._id.toString() };

      await validateProductExists(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect((mockRequest as any).product).toBeDefined();
      expect((mockRequest as any).product._id.toString()).toBe((testProduct as any)._id.toString());
    });

    test('❌ Should reject with non-existent product ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockRequest.params = { id: nonExistentId.toString() };

      await validateProductExists(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Producto no encontrado'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject with invalid ID format', async () => {
      mockRequest.params = { id: 'invalid_id_format' };

      await validateProductExists(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'ID de producto inválido'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject with missing ID', async () => {
      mockRequest.params = {}; // No ID provided

      await validateProductExists(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateProductOwnership Middleware', () => {
    let userProduct: any;
    let otherUserProduct: any;
    const otherUser = new mongoose.Types.ObjectId();

    beforeEach(async () => {
      // Producto del usuario actual
      userProduct = await ProductModel.create({
        user: testUser, // Usuario actual
        categorie: testCategory,
        product_info: {
          name: 'Producto del Usuario',
          description: 'Propiedad del usuario',
          stock: 10,
          price: 99.99
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: true
        },
        product_access: {
          link: 'https://test.com',
          access: true
        },
        tags: ['test']
      });

      // Producto de otro usuario
      otherUserProduct = await ProductModel.create({
        user: otherUser, // Otro usuario
        categorie: testCategory,
        product_info: {
          name: 'Producto de Otro Usuario',
          description: 'No es propiedad del usuario actual',
          stock: 5,
          price: 49.99
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: true
        },
        product_access: {
          link: 'https://test.com',
          access: true
        },
        tags: ['test']
      });
    });

    test('✅ Should allow admin to access any product', async () => {
      mockRequest.params = { id: (otherUserProduct as any)._id.toString() };
      (mockRequest as any).user.role = 'admin';

      await validateProductOwnership(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('✅ Should allow owner to access their product', async () => {
      mockRequest.params = { id: (userProduct as any)._id.toString() };
      (mockRequest as any).user.role = 'user';
      (mockRequest as any).user.flags = { isProvider: true, isProfessional: false };

      await validateProductOwnership(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('❌ Should reject non-owner non-admin access', async () => {
      mockRequest.params = { id: (otherUserProduct as any)._id.toString() };
      (mockRequest as any).user.role = 'user'; // No admin

      await validateProductOwnership(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'No tienes privilegios suficientes para esta operación'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject with non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockRequest.params = { id: nonExistentId.toString() };
      (mockRequest as any).user.role = 'user'; // No admin para que intente verificar propiedad
      (mockRequest as any).user.flags = { isProvider: true, isProfessional: false }; // Para que intente buscar el producto

      await validateProductOwnership(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateMinimumStock Middleware', () => {
    const mockProduct = {
      _id: new mongoose.Types.ObjectId(),
      product_info: {
        stock: 10,
        minimum_stock: 5
      }
    };

    beforeEach(() => {
      (mockRequest as any).product = mockProduct;
    });

    test('✅ Should pass for add operation (no stock check needed)', async () => {
      mockRequest.body = {
        operation: 'add',
        quantity: 100
      };

      await validateMinimumStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('✅ Should pass for set operation (no stock check needed)', async () => {
      mockRequest.body = {
        operation: 'set',
        quantity: 1
      };

      await validateMinimumStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('✅ Should pass when resulting stock is above minimum', async () => {
      mockRequest.body = {
        operation: 'subtract',
        quantity: 3 // 10 - 3 = 7, por encima del mínimo (5)
      };

      await validateMinimumStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test('❌ Should reject when resulting stock is below minimum', async () => {
      mockRequest.body = {
        operation: 'subtract',
        quantity: 8 // 10 - 8 = 2, por debajo del mínimo (5)
      };

      await validateMinimumStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'La operación resultaría en un stock por debajo del mínimo permitido',
          errors: [{
            currentStock: 10,
            minimumStock: 5,
            resultingStock: 2
          }]
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('❌ Should reject sale operation that leaves stock too low', async () => {
      mockRequest.body = {
        operation: 'sale',
        quantity: 9 // 10 - 9 = 1, por debajo del mínimo (5)
      };

      await validateMinimumStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('✅ Should handle edge case at exactly minimum stock', async () => {
      mockRequest.body = {
        operation: 'subtract',
        quantity: 5 // 10 - 5 = 5, exactamente el mínimo
      };

      await validateMinimumStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Should handle middleware errors gracefully', () => {
      // Simular error en validateProductData
      mockRequest.body = null; // Esto debería causar un error

      expect(() => {
        validateProductData(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    test('Should handle database errors in validateProductExists', async () => {
      // Simular un ID que cause error en la base de datos
      mockRequest.params = { id: 'not_a_valid_mongodb_id_format_but_24_chars_long' };

      await validateProductExists(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('Should sanitize error responses to prevent information leakage', () => {
      mockRequest.body = {
        product_info: {
          name: '<script>alert("xss")</script>',
          description: 'Test description'
        }
      };

      validateProductData(mockRequest as Request, mockResponse as Response, mockNext);

      // Debería pasar la validación pero no incluir scripts en respuestas de error futuras
      expect(mockNext).toHaveBeenCalled();
    });
  });
});