"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const chalk = require('chalk');
const environments_1 = require("../environments/environments");
const { MONGO_DB_URI } = (0, environments_1.environment)();
// Configuración optimizada para MongoDB
const mongoOptions = {
    maxPoolSize: 10, // Máximo 10 conexiones en el pool
    serverSelectionTimeoutMS: 30000, // Aumentar tiempo de espera para seleccionar servidor
    socketTimeoutMS: 45000, // Tiempo de espera para operaciones de socket
    bufferCommands: true, // Habilitar buffering de comandos para evitar errores de timing
    connectTimeoutMS: 30000, // Tiempo de espera para la conexión inicial
};
// Configuración específica para desarrollo vs producción
if (process.env.NODE_ENV === 'development') {
    // En desarrollo, configuraciones más permisivas
    mongoOptions.serverSelectionTimeoutMS = 10000;
    mongoose_1.default.set('debug', true); // Habilitar debug en desarrollo
}
mongoose_1.default
    .connect(MONGO_DB_URI.toString(), mongoOptions)
    .then(() => {
    console.log(`Working on ${chalk.greenBright('MongoDB')} ✔`);
    console.log(`${chalk.bgRed('Database connected... ')} 🚀`);
})
    .catch((err) => {
    console.error(chalk.red('Error connecting to MongoDB:'), err);
    process.exit(1); // Terminar la aplicación si no se puede conectar a la DB
});
// Manejo de eventos de conexión
mongoose_1.default.connection.on('error', (err) => {
    console.error(chalk.red('MongoDB connection error:'), err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log(chalk.yellow('MongoDB disconnected'));
});
// Manejo graceful de shutdown
process.on('SIGINT', async () => {
    await mongoose_1.default.connection.close();
    console.log(chalk.yellow('MongoDB connection closed through app termination'));
    process.exit(0);
});
//# sourceMappingURL=database.js.map