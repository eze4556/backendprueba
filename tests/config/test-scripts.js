// Test configuration and utility scripts for comprehensive testing

module.exports = {
  // Scripts para package.json
  scripts: {
    // Testing
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:security": "jest tests/security",
    "test:products": "jest tests/products",
    "test:middleware": "jest tests/middleware", 
    "test:integration": "jest tests/integration",
    "test:performance": "jest tests/integration/performance.test.ts",
    "test:workflows": "jest tests/integration/workflows.test.ts",
    "test:all": "npm run test:security && npm run test:products && npm run test:middleware && npm run test:integration",
    
    // Desarrollo
    "test:dev": "jest --watch --verbose",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    
    // CI/CD
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:silent": "jest --silent --verbose=false"
  },

  // Dependencias necesarias para testing
  devDependencies: {
    "@types/jest": "^29.5.5",
    "@types/supertest": "^2.0.12",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "ts-jest": "^29.1.1",
    "mongodb-memory-server": "^8.15.1"
  },

  // Configuración adicional para jest.config.js
  jestConfigExtended: {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "src/middleware/": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      },
      "src/app/productTypes/": {
        "branches": 85,
        "functions": 85,
        "lines": 85,
        "statements": 85
      }
    },
    "coverageReporters": [
      "text",
      "lcov",
      "html",
      "json-summary"
    ],
    "collectCoverageFrom": [
      "src/**/*.{ts,js}",
      "!src/**/*.d.ts",
      "!src/**/*.test.{ts,js}",
      "!src/**/__tests__/**",
      "!src/scripts/**",
      "!src/typings/**"
    ]
  }
};