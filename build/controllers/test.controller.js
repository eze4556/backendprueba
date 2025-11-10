"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEndpoint = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const testEndpoint = async (req, res) => {
    var _a;
    try {
        console.log('🔍 Test endpoint llamado');
        // Verificar conexión a la base de datos
        const dbState = mongoose_1.default.connection.readyState;
        const dbName = (_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName;
        console.log(`📊 Estado de la DB: ${dbState}, Nombre: ${dbName}`);
        const testData = {
            message: 'Servidor funcionando correctamente',
            timestamp: new Date(),
            database: {
                connected: dbState === 1,
                name: dbName
            }
        };
        console.log('✅ Enviando respuesta de prueba');
        return res.status(200).json(testData);
    }
    catch (error) {
        console.error('❌ Error en test endpoint:', error);
        return res.status(500).json({ error: 'Error en test endpoint' });
    }
};
exports.testEndpoint = testEndpoint;
//# sourceMappingURL=test.controller.js.map