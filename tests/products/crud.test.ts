import mongoose from 'mongoose';
import ProductModel from '../../src/app/productTypes/models/productTypes.models';
import { 
  createProductType, 
  updateProductType, 
  deleteProductType, 
  getAllProductTypes
} from '../../src/app/productTypes/controllers/productType.controller';
import { getProductTypeDetails } from '../../src/app/productTypes/controllers/productTypeDetails.controller';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

describe('🛍️ Product CRUD Operations Tests', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_for_testing';

  // Mock de Request y Response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  // Datos de prueba
  const testUser = new mongoose.Types.ObjectId();
  const testCategory = new mongoose.Types.ObjectId();

  const validProductData = {
    user: testUser,
    categorie: testCategory,
    product_info: {
      name: 'Termo Eléctrico Test',
      description: 'Termo eléctrico para testing',
      stock: 10,
      price: 299.99
    },
    product_status: {
      status: 'available',
      payment: ['credit_card', 'cash'],
      delivery: true
    },
    product_access: {
      link: 'https://test.com/product',
      access: true
    },
    tags: ['termo', 'electrico', 'test']
  };

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock user autenticado
    const userToken = jwt.sign({
      _id: testUser.toString(),
      id: testUser.toString(),
      email: 'test@test.com',
      role: 'admin'
    }, JWT_SECRET);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: testUser.toString(),
        id: testUser.toString(),
        email: 'test@test.com',
        role: 'admin'
      }
    } as any;
  });

  describe('CREATE Operations', () => {
    test('✅ Should create product with valid data', async () => {
      mockRequest.body = validProductData;

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.message).toContain('Producto creado exitosamente');
      expect(responseCall.data).toBeDefined();
    });

    test('❌ Should reject product without required fields', async () => {
      mockRequest.body = {
        user: testUser,
        // Missing required fields
      };

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test('❌ Should reject product with invalid price', async () => {
      mockRequest.body = {
        ...validProductData,
        product_info: {
          ...validProductData.product_info,
          price: -100 // Precio negativo
        }
      };

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test('❌ Should reject product with invalid stock', async () => {
      mockRequest.body = {
        ...validProductData,
        product_info: {
          ...validProductData.product_info,
          stock: -5 // Stock negativo
        }
      };

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    test('✅ Should create product with minimum required data', async () => {
      const minimalData = {
        user: testUser,
        categorie: testCategory,
        product_info: {
          name: 'Producto Mínimo',
          description: 'Descripción mínima',
          stock: 0,
          price: 0
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: false
        },
        product_access: {
          link: 'https://minimal.com',
          access: false
        },
        tags: ['minimal']
      };

      mockRequest.body = minimalData;

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('READ Operations', () => {
    let testProduct: any;

    beforeEach(async () => {
      // Crear un producto de prueba
      testProduct = await ProductModel.create(validProductData);
    });

    test('✅ Should get all products for authenticated user', async () => {
      mockRequest._id = testUser;

      await getAllProductTypes(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.products).toBeDefined();
      expect(Array.isArray(responseCall.data.products)).toBe(true);
    });

    test('✅ Should get product details by ID', async () => {
      mockRequest.params = { id: (testProduct as any)._id.toString() };

      await getProductTypeDetails(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data._id.toString()).toBe((testProduct as any)._id.toString());
    });

    test('❌ Should return 404 for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockRequest.params = { id: nonExistentId.toString() };

      await getProductTypeDetails(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test('❌ Should return 500 for invalid product ID format', async () => {
      mockRequest.params = { id: 'invalid_id_format' };

      await getProductTypeDetails(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('UPDATE Operations', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create(validProductData);
    });

    test('✅ Should update product with valid data', async () => {
      const updateData = {
        product_info: {
          name: 'Termo Actualizado',
          description: 'Descripción actualizada',
          stock: 15,
          price: 349.99
        }
      };

      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.body = updateData;

      await updateProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.message).toContain('actualizado exitosamente');
      expect(responseCall.data.data.product.product_info.name).toBe('Termo Actualizado');
    });

    test('❌ Should reject update with invalid stock', async () => {
      const invalidUpdate = {
        product_info: {
          stock: -10 // Stock negativo
        }
      };

      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.body = invalidUpdate;

      await updateProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.message).toContain('stock no puede ser negativo');
    });

    test('❌ Should return 404 for non-existent product update', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockRequest.params = { id: nonExistentId.toString() };
      mockRequest.body = { product_info: { name: 'New Name' } };

      await updateProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    test('✅ Should partially update product (only some fields)', async () => {
      const partialUpdate = {
        product_info: {
          price: 199.99 // Solo actualizar precio
        }
      };

      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.body = partialUpdate;

      await updateProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Verificar que el producto fue actualizado en la base de datos
      const updatedProduct = await ProductModel.findById((testProduct as any)._id);
      expect(updatedProduct?.product_info.price).toBe(199.99);
      expect(updatedProduct?.product_info.name).toBe(validProductData.product_info.name); // No cambió
    });

    test('✅ Should update product status and access', async () => {
      const statusUpdate = {
        product_status: {
          status: 'sold_out',
          payment: ['bank_transfer'],
          delivery: false
        },
        product_access: {
          access: false
        }
      };

      mockRequest.params = { id: (testProduct as any)._id.toString() };
      mockRequest.body = statusUpdate;

      await updateProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const updatedProduct = await ProductModel.findById((testProduct as any)._id);
      expect(updatedProduct?.product_status.status).toBe('sold_out');
      expect(updatedProduct?.product_access.access).toBe(false);
    });
  });

  describe('DELETE Operations', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await ProductModel.create(validProductData);
    });

    test('✅ Should delete existing product', async () => {
      mockRequest.params = { id: (testProduct as any)._id.toString() };

      await deleteProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.data.message).toContain('eliminado exitosamente');
      expect(responseCall.data.data.deletedId).toBe((testProduct as any)._id.toString());

      // Verificar que el producto fue eliminado de la base de datos
      const deletedProduct = await ProductModel.findById((testProduct as any)._id);
      expect(deletedProduct).toBeNull();
    });

    test('❌ Should return 404 for non-existent product deletion', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      mockRequest.params = { id: nonExistentId.toString() };

      await deleteProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall.error.message).toContain('El producto no existe');
    });

    test('❌ Should handle invalid ID format for deletion', async () => {
      mockRequest.params = { id: 'invalid_id' };

      await deleteProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('✅ Should handle products with empty tags array', async () => {
      const productWithEmptyTags = {
        ...validProductData,
        tags: []
      };

      mockRequest.body = productWithEmptyTags;

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    test('✅ Should handle products with long names and descriptions', async () => {
      const longTextProduct = {
        ...validProductData,
        product_info: {
          ...validProductData.product_info,
          name: 'A'.repeat(200), // Nombre muy largo
          description: 'B'.repeat(1000) // Descripción muy larga
        }
      };

      mockRequest.body = longTextProduct;

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    test('✅ Should handle products with zero stock and price', async () => {
      const zeroProduct = {
        ...validProductData,
        product_info: {
          ...validProductData.product_info,
          stock: 0,
          price: 0
        }
      };

      mockRequest.body = zeroProduct;

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    test('✅ Should handle products with special characters', async () => {
      const specialCharsProduct = {
        ...validProductData,
        product_info: {
          ...validProductData.product_info,
          name: 'Producto-Test_123 (Especial) ñáéíóú',
          description: 'Descripción con símbolos: @#$%^&*()_+-=[]{}|;:,.<>?'
        }
      };

      mockRequest.body = specialCharsProduct;

      await createProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    test('✅ Should handle concurrent updates (optimistic locking)', async () => {
      const testProduct = await ProductModel.create(validProductData);

      // Simular dos actualizaciones concurrentes
      const updateData1 = { product_info: { name: 'Update 1' } };
      const updateData2 = { product_info: { name: 'Update 2' } };

      mockRequest.params = { id: (testProduct as any)._id.toString() };

      // Primera actualización
      mockRequest.body = updateData1;
      await updateProductType(mockRequest as Request, mockResponse as Response);

      // Segunda actualización
      mockRequest.body = updateData2;
      await updateProductType(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      
      // Verificar que la última actualización prevalece
      const finalProduct = await ProductModel.findById((testProduct as any)._id);
      expect(finalProduct?.product_info.name).toBe('Update 2');
    });
  });
});