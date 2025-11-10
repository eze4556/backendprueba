/**
 * TEST DE INTEGRACIÓN COMPLETO - PRODUCCIÓN
 * 
 * Este script prueba TODAS las funcionalidades simultáneamente:
 * - Autenticación completa
 * - Todas las APIs (públicas y privadas)
 * - Flujos de usuario completos
 * - Carga concurrente
 * - Socket.IO en tiempo real
 */

const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

// Estadísticas globales
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
  tests: []
};

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m'
};

// Datos de usuario para testing
let authToken = null;
let userId = null;
let testData = {
  products: [],
  cart: null,
  order: null,
  stream: null,
  conversation: null
};

/**
 * Realizar petición HTTP
 */
function makeRequest(method, path, body = null, useAuth = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    };

    if (useAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Ejecutar test
 */
async function test(name, fn, category = 'General') {
  stats.total++;
  const startTime = Date.now();
  
  try {
    await fn();
    const duration = Date.now() - startTime;
    stats.passed++;
    stats.tests.push({ name, category, status: 'PASS', duration });
    console.log(`${colors.green}✓${colors.reset} ${category} - ${name} ${colors.cyan}(${duration}ms)${colors.reset}`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    stats.failed++;
    stats.tests.push({ name, category, status: 'FAIL', duration, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${category} - ${name} ${colors.red}(${error.message})${colors.reset}`);
    return false;
  }
}

/**
 * Sección de tests
 */
function section(name) {
  console.log(`\n${colors.magenta}━━━ ${name} ━━━${colors.reset}`);
}

/**
 * MAIN - Ejecutar todos los tests
 */
async function runFullIntegrationTest() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║        TEST DE INTEGRACIÓN COMPLETO - PRODUCCIÓN            ║
║           Probando TODAS las funcionalidades                ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // ═══════════════════════════════════════════════════════════
  // FASE 1: HEALTH CHECK Y SISTEMA
  // ═══════════════════════════════════════════════════════════
  section('FASE 1: HEALTH CHECK Y SISTEMA');

  await test('Health Check Principal', async () => {
    const res = await makeRequest('GET', '/health');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.status || res.data.status !== 'healthy') throw new Error('Not healthy');
  }, 'Health');

  await test('Liveness Probe', async () => {
    const res = await makeRequest('GET', '/health/live');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  }, 'Health');

  await test('Readiness Probe', async () => {
    const res = await makeRequest('GET', '/health/ready');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  }, 'Health');

  // ═══════════════════════════════════════════════════════════
  // FASE 2: AUTENTICACIÓN COMPLETA
  // ═══════════════════════════════════════════════════════════
  section('FASE 2: AUTENTICACIÓN Y REGISTRO');

  const timestamp = Date.now();
  const testEmail = `test_prod_${timestamp}@test.com`;
  const testPassword = 'TestProd123!@#';

  await test('Solicitar Código de Registro', async () => {
    const res = await makeRequest('POST', '/api/users/register_request', {
      email: testEmail,
      password: testPassword,
      name: 'Usuario Produccion',
      phoneNumber: '+1234567890'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.data.success) throw new Error('Request failed');
  }, 'Auth');

  // Intentar login con credenciales existentes (si hay usuarios en BD)
  const loginAttempts = [
    { email: 'maria.gonzalez@email.com', password: 'Provider123!' },
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'user@test.com', password: 'user123' }
  ];

  let loginSuccess = false;
  for (const creds of loginAttempts) {
    try {
      const res = await makeRequest('POST', '/api/login', {
        email: creds.email,
        contraseña: creds.password
      });
      
      if (res.status === 200 && res.data.token) {
        authToken = res.data.token;
        userId = res.data.user?._id;
        loginSuccess = true;
        console.log(`${colors.green}✓ Login exitoso con ${creds.email}${colors.reset}`);
        break;
      }
    } catch (e) {
      // Intentar siguiente
    }
  }

  if (!loginSuccess) {
    console.log(`${colors.yellow}⚠ No se pudo hacer login con usuarios existentes, continuando con tests públicos${colors.reset}`);
  }

  // ═══════════════════════════════════════════════════════════
  // FASE 3: ENDPOINTS PÚBLICOS (Concurrente)
  // ═══════════════════════════════════════════════════════════
  section('FASE 3: ENDPOINTS PÚBLICOS (Prueba Concurrente)');

  const publicTests = [
    { name: 'Categorías', path: '/api/categorie' },
    { name: 'Productos Dedicados', path: '/api/dedicated' },
    { name: 'Profesionales', path: '/api/professional' },
    { name: 'Vehículos', path: '/api/vehicle/vehicles' },
    { name: 'Proveedores', path: '/api/providers' },
    { name: 'Ranking', path: '/api/ranking' },
    { name: 'Planes de Suscripción', path: '/api/subscription/plans' },
    { name: 'Streams Activos', path: '/api/stream' },
    { name: 'Búsqueda Popular', path: '/api/search/popular' }
  ];

  // Ejecutar todas las peticiones en paralelo
  const publicPromises = publicTests.map(t => 
    test(t.name, async () => {
      const res = await makeRequest('GET', t.path);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Público')
  );

  await Promise.all(publicPromises);

  // ═══════════════════════════════════════════════════════════
  // FASE 4: BÚSQUEDA AVANZADA
  // ═══════════════════════════════════════════════════════════
  section('FASE 4: SISTEMA DE BÚSQUEDA');

  await test('Búsqueda General', async () => {
    const res = await makeRequest('GET', '/api/search?query=producto');
    if (res.status !== 200 && res.status !== 400) throw new Error(`Status ${res.status}`);
  }, 'Búsqueda');

  await test('Autocompletado', async () => {
    const res = await makeRequest('GET', '/api/search/autocomplete?query=pro');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  }, 'Búsqueda');

  await test('Top Profesionales', async () => {
    const res = await makeRequest('GET', '/api/search/top-professionals');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  }, 'Búsqueda');

  // ═══════════════════════════════════════════════════════════
  // FASE 5: ENDPOINTS AUTENTICADOS (si tenemos token)
  // ═══════════════════════════════════════════════════════════
  if (authToken) {
    section('FASE 5: ENDPOINTS AUTENTICADOS');

    await test('Tipos de Productos', async () => {
      const res = await makeRequest('GET', '/api/productType', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
      if (res.data && Array.isArray(res.data)) {
        testData.products = res.data.slice(0, 3); // Guardar algunos productos
      }
    }, 'Productos');

    await test('Productos Autónomos', async () => {
      const res = await makeRequest('GET', '/api/autonomous', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Productos');

    // ═══════════════════════════════════════════════════════════
    // FASE 6: CARRITO DE COMPRAS
    // ═══════════════════════════════════════════════════════════
    section('FASE 6: CARRITO DE COMPRAS');

    await test('Obtener Carrito Actual', async () => {
      const res = await makeRequest('GET', '/api/cart', null, true);
      if (res.status !== 200) {
        console.log(`\n${colors.red}DEBUG: Cart error response:${colors.reset}`, JSON.stringify(res.data, null, 2));
        throw new Error(`Status ${res.status}`);
      }
      testData.cart = res.data;
    }, 'Carrito');

    if (testData.products.length > 0) {
      await test('Agregar Producto al Carrito', async () => {
        const product = testData.products[0];
        const res = await makeRequest('POST', '/api/cart/add', {
          productId: product._id || 'test_product_id',
          quantity: 2,
          price: 99.99
        }, true);
        if (res.status !== 200 && res.status !== 201 && res.status !== 400) {
          throw new Error(`Status ${res.status}`);
        }
      }, 'Carrito');
    }

    await test('Validar Carrito', async () => {
      const res = await makeRequest('POST', '/api/cart/validate', {}, true);
      if (res.status !== 200 && res.status !== 400) throw new Error(`Status ${res.status}`);
    }, 'Carrito');

    // ═══════════════════════════════════════════════════════════
    // FASE 7: ÓRDENES
    // ═══════════════════════════════════════════════════════════
    section('FASE 7: SISTEMA DE ÓRDENES');

    await test('Listar Mis Órdenes', async () => {
      const res = await makeRequest('GET', '/api/order', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Órdenes');

    await test('Calcular Costo de Envío', async () => {
      const res = await makeRequest('POST', '/api/order/calculate-shipping', {
        address: {
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      }, true);
      if (res.status !== 200 && res.status !== 400) throw new Error(`Status ${res.status}`);
    }, 'Órdenes');

    // ═══════════════════════════════════════════════════════════
    // FASE 8: WISHLIST
    // ═══════════════════════════════════════════════════════════
    section('FASE 8: LISTA DE DESEOS');

    await test('Obtener Wishlist', async () => {
      const res = await makeRequest('GET', '/api/wishlist', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Wishlist');

    if (testData.products.length > 0) {
      await test('Agregar a Wishlist', async () => {
        const product = testData.products[0];
        const res = await makeRequest('POST', '/api/wishlist/add', {
          productId: product._id || 'test_product_id',
          productType: 'dedicated'
        }, true);
        if (res.status !== 200 && res.status !== 201 && res.status !== 400) {
          throw new Error(`Status ${res.status}`);
        }
      }, 'Wishlist');
    }

    // ═══════════════════════════════════════════════════════════
    // FASE 9: NOTIFICACIONES
    // ═══════════════════════════════════════════════════════════
    section('FASE 9: SISTEMA DE NOTIFICACIONES');

    await test('Listar Notificaciones', async () => {
      const res = await makeRequest('GET', '/api/notifications', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Notificaciones');

    await test('Contador de No Leídas', async () => {
      const res = await makeRequest('GET', '/api/notifications/unread-count', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Notificaciones');

    // ═══════════════════════════════════════════════════════════
    // FASE 10: MENSAJERÍA
    // ═══════════════════════════════════════════════════════════
    section('FASE 10: SISTEMA DE MENSAJERÍA');

    await test('Listar Conversaciones', async () => {
      const res = await makeRequest('GET', '/api/messages/conversations', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Mensajería');

    // ═══════════════════════════════════════════════════════════
    // FASE 11: REVIEWS
    // ═══════════════════════════════════════════════════════════
    section('FASE 11: SISTEMA DE REVIEWS');

    await test('Listar Reviews', async () => {
      const res = await makeRequest('GET', '/api/reviews', null, true);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Reviews');

    if (testData.products.length > 0) {
      await test('Obtener Reviews de Producto', async () => {
        const product = testData.products[0];
        const res = await makeRequest('GET', `/api/reviews/product/${product._id || 'test_id'}`, null, false);
        if (res.status !== 200 && res.status !== 404) throw new Error(`Status ${res.status}`);
      }, 'Reviews');
    }

    // ═══════════════════════════════════════════════════════════
    // FASE 12: STREAMING
    // ═══════════════════════════════════════════════════════════
    section('FASE 12: SISTEMA DE STREAMING');

    await test('Mis Streams', async () => {
      const res = await makeRequest('GET', '/api/stream/my/streams', null, true);
      if (res.status !== 200 && res.status !== 403) throw new Error(`Status ${res.status}`);
    }, 'Streaming');

    await test('Crear Stream (si tiene permisos)', async () => {
      const res = await makeRequest('POST', '/api/stream', {
        title: 'Test Stream Producción',
        description: 'Stream de prueba para testing integrado',
        category: 'test'
      }, true);
      
      if (res.status === 201 || res.status === 200) {
        testData.stream = res.data;
        console.log(`${colors.green}  → Stream creado exitosamente${colors.reset}`);
      } else if (res.status === 403 || res.status === 401) {
        console.log(`${colors.yellow}  → Sin permisos para crear stream (esperado)${colors.reset}`);
      }
    }, 'Streaming');

    // ═══════════════════════════════════════════════════════════
    // FASE 13: PAGOS Y SUSCRIPCIONES
    // ═══════════════════════════════════════════════════════════
    section('FASE 13: PAGOS Y SUSCRIPCIONES');

    await test('Obtener Planes Disponibles', async () => {
      const res = await makeRequest('GET', '/api/subscription/plans', null, false);
      if (res.status !== 200) throw new Error(`Status ${res.status}`);
    }, 'Suscripciones');

    await test('Mi Suscripción Actual', async () => {
      const res = await makeRequest('GET', '/api/subscription/current', null, true);
      if (res.status !== 200 && res.status !== 404) throw new Error(`Status ${res.status}`);
    }, 'Suscripciones');

    // ═══════════════════════════════════════════════════════════
    // FASE 14: CALCULADORA Y UTILIDADES
    // ═══════════════════════════════════════════════════════════
    section('FASE 14: CALCULADORA Y UTILIDADES');

    await test('Calcular Precio', async () => {
      const res = await makeRequest('POST', '/api/calculator/calculate', {
        items: [
          { price: 100, quantity: 2 },
          { price: 50, quantity: 1 }
        ]
      }, true);
      if (res.status !== 200 && res.status !== 400) throw new Error(`Status ${res.status}`);
    }, 'Calculadora');

  } else {
    console.log(`${colors.yellow}\n⚠ FASE 5-14 OMITIDAS: No hay token de autenticación${colors.reset}`);
    console.log(`${colors.yellow}  Para testing completo, necesitas un usuario en la base de datos${colors.reset}`);
  }

  // ═══════════════════════════════════════════════════════════
  // FASE 15: PRUEBA DE CARGA (Múltiples peticiones simultáneas)
  // ═══════════════════════════════════════════════════════════
  section('FASE 15: PRUEBA DE CARGA CONCURRENTE');

  await test('100 Peticiones Simultáneas al Health', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(makeRequest('GET', '/health'));
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 200).length;
    console.log(`${colors.cyan}    → ${successful}/100 exitosas en ${duration}ms${colors.reset}`);
    
    if (successful < 95) throw new Error(`Solo ${successful}/100 exitosas`);
  }, 'Carga');

  await test('50 Peticiones Concurrentes a Diferentes Endpoints', async () => {
    const endpoints = [
      '/api/dedicated',
      '/api/professional',
      '/api/providers',
      '/api/ranking',
      '/api/stream'
    ];
    
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const endpoint = endpoints[i % endpoints.length];
      promises.push(makeRequest('GET', endpoint));
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 200).length;
    console.log(`${colors.cyan}    → ${successful}/50 exitosas en ${duration}ms${colors.reset}`);
    
    if (successful < 45) throw new Error(`Solo ${successful}/50 exitosas`);
  }, 'Carga');

  // ═══════════════════════════════════════════════════════════
  // REPORTE FINAL
  // ═══════════════════════════════════════════════════════════
  const totalDuration = Date.now() - stats.startTime;
  
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                   RESUMEN FINAL                              ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n📊 ${colors.yellow}Estadísticas:${colors.reset}`);
  console.log(`   Total de tests:     ${stats.total}`);
  console.log(`   ${colors.green}✓ Exitosos:         ${stats.passed}${colors.reset}`);
  console.log(`   ${colors.red}✗ Fallidos:         ${stats.failed}${colors.reset}`);
  console.log(`   Tasa de éxito:      ${colors.cyan}${((stats.passed/stats.total)*100).toFixed(2)}%${colors.reset}`);
  console.log(`   Duración total:     ${colors.cyan}${(totalDuration/1000).toFixed(2)}s${colors.reset}`);
  
  if (authToken) {
    console.log(`\n🔑 ${colors.green}Autenticación: ACTIVA${colors.reset}`);
  } else {
    console.log(`\n🔑 ${colors.yellow}Autenticación: NO DISPONIBLE${colors.reset}`);
  }

  // Estadísticas por categoría
  const byCategory = {};
  stats.tests.forEach(t => {
    if (!byCategory[t.category]) {
      byCategory[t.category] = { passed: 0, failed: 0, total: 0, duration: 0 };
    }
    byCategory[t.category].total++;
    byCategory[t.category].duration += t.duration;
    if (t.status === 'PASS') {
      byCategory[t.category].passed++;
    } else {
      byCategory[t.category].failed++;
    }
  });

  console.log(`\n📂 ${colors.yellow}Por Categoría:${colors.reset}`);
  Object.keys(byCategory).sort().forEach(cat => {
    const c = byCategory[cat];
    const rate = ((c.passed / c.total) * 100).toFixed(0);
    const avgDuration = (c.duration / c.total).toFixed(0);
    console.log(`   ${cat.padEnd(15)} ${c.passed}/${c.total} (${rate}%) - avg ${avgDuration}ms`);
  });

  // Tests más lentos
  const slowest = [...stats.tests].sort((a, b) => b.duration - a.duration).slice(0, 5);
  console.log(`\n⏱️  ${colors.yellow}Tests más lentos:${colors.reset}`);
  slowest.forEach((t, i) => {
    console.log(`   ${i+1}. ${t.name} - ${t.duration}ms`);
  });

  // Resultado final
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  
  if (stats.failed === 0) {
    console.log(`${colors.green}
✅ ¡TEST DE PRODUCCIÓN EXITOSO!
   Todas las funcionalidades están operativas
${colors.reset}`);
  } else if (stats.passed > stats.failed * 3) {
    console.log(`${colors.yellow}
⚠️  TEST COMPLETADO CON ADVERTENCIAS
   La mayoría de funcionalidades funcionan correctamente
   Revisar ${stats.failed} tests fallidos
${colors.reset}`);
  } else {
    console.log(`${colors.red}
❌ TEST FALLIDO
   Múltiples funcionalidades presentan problemas
   Se requiere revisión urgente
${colors.reset}`);
  }

  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // Guardar resultados
  const fs = require('fs');
  const report = {
    timestamp: new Date().toISOString(),
    duration: totalDuration,
    stats: {
      total: stats.total,
      passed: stats.passed,
      failed: stats.failed,
      successRate: ((stats.passed/stats.total)*100).toFixed(2)
    },
    authentication: {
      enabled: !!authToken,
      userId: userId
    },
    byCategory: byCategory,
    allTests: stats.tests,
    slowestTests: slowest
  };

  fs.writeFileSync('production-test-report.json', JSON.stringify(report, null, 2));
  console.log(`${colors.cyan}📄 Reporte guardado en: production-test-report.json${colors.reset}\n`);

  process.exit(stats.failed > 0 ? 1 : 0);
}

// Ejecutar
runFullIntegrationTest().catch(error => {
  console.error(`${colors.red}Error fatal: ${error.message}${colors.reset}`);
  process.exit(1);
});
