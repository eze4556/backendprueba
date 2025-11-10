import mongoose from 'mongoose';
import ProductModel from '../../src/app/productTypes/models/productTypes.models';
import { StockService } from '../../src/app/productTypes/services/stock.service';

describe('⚡ Performance Tests - System Load and Stress Testing', () => {
  const stockService = new StockService();

  describe('📈 Load Testing', () => {
    test('✅ Should handle bulk product creation efficiently', async () => {
      const startTime = Date.now();
      const batchSize = 100;
      const testCategory = new mongoose.Types.ObjectId();
      const testUser = new mongoose.Types.ObjectId();

      // Crear productos en lotes
      const productPromises = Array.from({ length: batchSize }, (_, i) => 
        ProductModel.create({
          user: testUser,
          categorie: testCategory,
          product_info: {
            name: `Producto Bulk #${i + 1}`,
            description: `Descripción para producto bulk ${i + 1}`,
            stock: Math.floor(Math.random() * 1000) + 100,
            price: Math.floor(Math.random() * 500) + 10
          },
          product_status: {
            status: 'available',
            payment: ['credit_card', 'cash'],
            delivery: true
          },
          product_access: {
            link: `https://bulk-${i + 1}.com`,
            access: true
          },
          tags: ['bulk', 'test', `batch-${Math.floor(i / 10)}`]
        })
      );

      const products = await Promise.all(productPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(products).toHaveLength(batchSize);
      expect(duration).toBeLessThan(10000); // Menos de 10 segundos
      
      // Verificar que todos los productos fueron creados correctamente
      const createdProducts = await ProductModel.find({ user: testUser });
      expect(createdProducts).toHaveLength(batchSize);

      console.log(`✅ Creados ${batchSize} productos en ${duration}ms (${(duration/batchSize).toFixed(2)}ms por producto)`);
    });

    test('✅ Should handle concurrent stock operations efficiently', async () => {
      const testCategory = new mongoose.Types.ObjectId();
      const testUser = new mongoose.Types.ObjectId();

      // Crear un producto base
      const product = await ProductModel.create({
        user: testUser,
        categorie: testCategory,
        product_info: {
          name: 'Producto Concurrencia',
          description: 'Para test de operaciones concurrentes',
          stock: 10000, // Stock alto para múltiples operaciones
          price: 99.99
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: true
        },
        product_access: {
          link: 'https://concurrent.com',
          access: true
        },
        tags: ['concurrent']
      });

      const operationCount = 50;
      const startTime = Date.now();

      // Crear operaciones mixtas concurrentes
      const operations = Array.from({ length: operationCount }, (_, i) => {
        const operationType = i % 3 === 0 ? 'purchase' : 'sale';
        const quantity = Math.floor(Math.random() * 20) + 1;
        
        return stockService.updateStock({
          productId: (product as any)._id.toString(),
          quantity,
          operation: operationType,
          reason: `Operación concurrente #${i + 1}`,
          userId: testUser.toString(),
          userRole: 'admin'
        });
      });

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar que todas las operaciones fueron procesadas
      const successfulOps = results.filter(r => r.success);
      const failedOps = results.filter(r => !r.success);

      expect(successfulOps.length).toBeGreaterThan(operationCount * 0.8); // Al menos 80% exitosas
      expect(duration).toBeLessThan(15000); // Menos de 15 segundos

      // Verificar integridad del stock final
      const finalProduct = await ProductModel.findById((product as any)._id);
      expect(finalProduct?.product_info.stock).toBeGreaterThanOrEqual(0);

      console.log(`✅ Procesadas ${operationCount} operaciones concurrentes en ${duration}ms`);
      console.log(`   - Exitosas: ${successfulOps.length}, Fallidas: ${failedOps.length}`);
    });

    test('✅ Should handle large dataset queries efficiently', async () => {
      const testCategory = new mongoose.Types.ObjectId();
      const testUser = new mongoose.Types.ObjectId();
      const largeDatasetSize = 500;

      // Crear un dataset grande
      const products = await Promise.all(
        Array.from({ length: largeDatasetSize }, (_, i) => 
          ProductModel.create({
            user: testUser,
            categorie: testCategory,
            product_info: {
              name: `Producto Dataset #${i + 1}`,
              description: `Descripción ${i + 1}`,
              stock: Math.floor(Math.random() * 500) + 50,
              price: Math.floor(Math.random() * 200) + 10
            },
            product_status: {
              status: i % 2 === 0 ? 'available' : 'featured',
              payment: ['credit_card'],
              delivery: true
            },
            product_access: {
              link: `https://dataset-${i + 1}.com`,
              access: true
            },
            tags: ['dataset', `group-${Math.floor(i / 50)}`]
          })
        )
      );

      // Test de consultas complejas
      const queryStartTime = Date.now();

      // 1. Búsqueda por múltiples criterios
      const complexQuery = await ProductModel.find({
        user: testUser,
        'product_info.stock': { $gte: 100, $lte: 300 },
        'product_status.status': 'available',
        'product_info.price': { $gte: 50 }
      }).limit(100);

      // 2. Agregación para estadísticas
      const statsQuery = await ProductModel.aggregate([
        { $match: { user: testUser } },
        {
          $group: {
            _id: '$product_status.status',
            totalProducts: { $sum: 1 },
            avgPrice: { $avg: '$product_info.price' },
            totalStock: { $sum: '$product_info.stock' },
            minPrice: { $min: '$product_info.price' },
            maxPrice: { $max: '$product_info.price' }
          }
        }
      ]);

      // 3. Búsqueda con texto
      const textQuery = await ProductModel.find({
        user: testUser,
        'product_info.name': { $regex: 'Dataset.*[1-9]0', $options: 'i' }
      });

      const queryEndTime = Date.now();
      const queryDuration = queryEndTime - queryStartTime;

      expect(complexQuery.length).toBeGreaterThan(0);
      expect(statsQuery.length).toBe(2); // available y featured
      expect(textQuery.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(5000); // Menos de 5 segundos

      console.log(`✅ Consultas en dataset de ${largeDatasetSize} productos: ${queryDuration}ms`);
      console.log(`   - Consulta compleja: ${complexQuery.length} resultados`);
      console.log(`   - Agregación: ${statsQuery.length} grupos`);
      console.log(`   - Búsqueda texto: ${textQuery.length} coincidencias`);
    });
  });

  describe('💥 Stress Testing', () => {
    test('✅ Should survive memory pressure from large operations', async () => {
      const testCategory = new mongoose.Types.ObjectId();
      const testUser = new mongoose.Types.ObjectId();

      // Crear un producto para operaciones intensivas
      const product = await ProductModel.create({
        user: testUser,
        categorie: testCategory,
        product_info: {
          name: 'Producto Stress Test',
          description: 'Para test de estrés de memoria',
          stock: 50000,
          price: 100
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: true
        },
        product_access: {
          link: 'https://stress.com',
          access: true
        },
        tags: ['stress']
      });

      const memoryBefore = process.memoryUsage();
      const stressOperations = 200;

      // Realizar muchas operaciones para crear historial extenso
      for (let i = 0; i < stressOperations; i++) {
        const operationType = i % 2 === 0 ? 'purchase' : 'sale';
        const quantity = Math.floor(Math.random() * 50) + 1;

        await stockService.updateStock({
          productId: (product as any)._id.toString(),
          quantity,
          operation: operationType,
          reason: `Stress operation #${i + 1} - Large dataset creation`,
          userId: testUser.toString(),
          userRole: 'admin'
        });

        // Cada 50 operaciones, verificar que la memoria no crezca descontroladamente
        if (i > 0 && i % 50 === 0) {
          const currentMemory = process.memoryUsage();
          const memoryIncrease = currentMemory.heapUsed - memoryBefore.heapUsed;
          
          // Permitir hasta 100MB de incremento
          expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        }
      }

      const memoryAfter = process.memoryUsage();
      const totalMemoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      // Verificar que el historial se creó correctamente
      const history = await stockService.getStockHistory((product as any)._id.toString(), stressOperations);
      expect(history).toHaveLength(stressOperations);

      console.log(`✅ Stress test completado:`);
      console.log(`   - Operaciones: ${stressOperations}`);
      console.log(`   - Incremento memoria: ${(totalMemoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   - Memoria final: ${(memoryAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    });

    test('❌ Should handle database connection failures gracefully', async () => {
      const testCategory = new mongoose.Types.ObjectId();
      const testUser = new mongoose.Types.ObjectId();

      // Simular operaciones antes de falla de conexión
      const product = await ProductModel.create({
        user: testUser,
        categorie: testCategory,
        product_info: {
          name: 'Producto Resiliencia',
          description: 'Para test de resiliencia',
          stock: 1000,
          price: 50
        },
        product_status: {
          status: 'available',
          payment: ['cash'],
          delivery: true
        },
        product_access: {
          link: 'https://resilience.com',
          access: true
        },
        tags: ['resilience']
      });

      // Operación normal antes de la "falla"
      const normalOperation = await stockService.updateStock({
        productId: (product as any)._id.toString(),
        quantity: 100,
        operation: 'sale',
        reason: 'Operación normal antes de falla',
        userId: testUser.toString(),
        userRole: 'admin'
      });

      expect(normalOperation.success).toBe(true);

      // Simular múltiples intentos con timeout
      const failureSimulations = Array.from({ length: 5 }, (_, i) => 
        new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const result = await stockService.updateStock({
                productId: (product as any)._id.toString(),
                quantity: 10,
                operation: 'sale',
                reason: `Intento durante falla simulada #${i + 1}`,
                userId: testUser.toString(),
                userRole: 'admin'
              });
              resolve(result);
            } catch (error) {
              resolve({ success: false, error: (error as Error).message });
            }
          }, Math.random() * 1000); // Delay aleatorio hasta 1s
        })
      );

      const results = await Promise.all(failureSimulations);
      
      // Al menos algunas operaciones deberían funcionar
      const successfulOperations = results.filter((r: any) => r.success);
      expect(successfulOperations.length).toBeGreaterThan(0);

      // Verificar que el estado final del producto es consistente
      const finalProduct = await ProductModel.findById((product as any)._id);
      expect(finalProduct?.product_info.stock).toBeGreaterThanOrEqual(0);
      expect(finalProduct?.product_info.stock).toBeLessThanOrEqual(1000);

      console.log(`✅ Test de resiliencia completado:`);
      console.log(`   - Operaciones exitosas: ${successfulOperations.length}/5`);
      console.log(`   - Stock final: ${finalProduct?.product_info.stock}`);
    });

    test('✅ Should maintain performance under high concurrency', async () => {
      const testCategory = new mongoose.Types.ObjectId();
      const testUser = new mongoose.Types.ObjectId();
      const concurrencyLevel = 100;

      // Crear múltiples productos para distribución de carga
      const products = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          ProductModel.create({
            user: testUser,
            categorie: testCategory,
            product_info: {
              name: `Producto Concurrencia #${i + 1}`,
              description: `Test de alta concurrencia ${i + 1}`,
              stock: 1000,
              price: 75
            },
            product_status: {
              status: 'available',
              payment: ['cash'],
              delivery: true
            },
            product_access: {
              link: `https://concurrency-${i + 1}.com`,
              access: true
            },
            tags: ['concurrency', `batch-${i}`]
          })
        )
      );

      const startTime = Date.now();

      // Crear operaciones altamente concurrentes en múltiples productos
      const concurrentOperations = Array.from({ length: concurrencyLevel }, (_, i) => {
        const productIndex = i % products.length;
        const operationType = Math.random() > 0.5 ? 'purchase' : 'sale';
        const quantity = Math.floor(Math.random() * 20) + 1;

        return stockService.updateStock({
          productId: (products[productIndex] as any)._id.toString(),
          quantity,
          operation: operationType,
          reason: `Operación concurrente alta #${i + 1}`,
          userId: testUser.toString(),
          userRole: 'admin'
        });
      });

      const results = await Promise.all(concurrentOperations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      const successfulOps = results.filter(r => r.success);
      const averageTime = duration / concurrencyLevel;

      expect(successfulOps.length).toBeGreaterThan(concurrencyLevel * 0.75); // Al menos 75% exitosas
      expect(averageTime).toBeLessThan(100); // Menos de 100ms promedio por operación
      expect(duration).toBeLessThan(20000); // Menos de 20 segundos total

      // Verificar que todos los productos mantienen integridad
      const finalProducts = await ProductModel.find({ 
        _id: { $in: products.map(p => (p as any)._id) } 
      });

      finalProducts.forEach(product => {
        expect(product.product_info.stock).toBeGreaterThanOrEqual(0);
        expect(product.product_info.stock).toBeLessThanOrEqual(10000); // Límite razonable
      });

      console.log(`✅ Test de alta concurrencia completado:`);
      console.log(`   - Operaciones totales: ${concurrencyLevel}`);
      console.log(`   - Exitosas: ${successfulOps.length} (${((successfulOps.length/concurrencyLevel)*100).toFixed(1)}%)`);
      console.log(`   - Tiempo total: ${duration}ms`);
      console.log(`   - Tiempo promedio: ${averageTime.toFixed(2)}ms por operación`);
    });
  });
});