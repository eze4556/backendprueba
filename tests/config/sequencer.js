// Secuenciador personalizado para ejecutar tests en orden óptimo
const Sequencer = require('@jest/test-sequencer').default;

class ComprehensiveTestSequencer extends Sequencer {
  sort(tests) {
    // Ordenar tests por prioridad y dependencias
    const testOrder = [
      // 1. Tests de configuración y setup
      'setup.test',
      
      // 2. Tests unitarios básicos
      'unit',
      
      // 3. Tests de autenticación y seguridad
      'auth.test',
      'security',
      'advanced-security.test',
      
      // 4. Tests de middleware
      'middleware',
      'validation.test',
      
      // 5. Tests de CRUD básico
      'crud.test',
      'comprehensive-crud.test',
      
      // 6. Tests de lógica de negocio
      'business',
      'payments-billing.test',
      
      // 7. Tests de integración
      'integration',
      'complete-system.test',
      'workflows.test',
      
      // 8. Tests de performance (último para no afectar otros tests)
      'performance',
      'load-testing.test'
    ];

    return tests.sort((testA, testB) => {
      const getTestPriority = (testPath) => {
        for (let i = 0; i < testOrder.length; i++) {
          if (testPath.includes(testOrder[i])) {
            return i;
          }
        }
        return testOrder.length; // Tests sin prioridad específica van al final
      };

      const priorityA = getTestPriority(testA.path);
      const priorityB = getTestPriority(testB.path);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Si tienen la misma prioridad, ordenar alfabéticamente
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = ComprehensiveTestSequencer;