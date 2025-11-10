"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// Importa la aplicación principal de Express
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const http_1 = require("http");
const stream_socket_1 = require("./live/socket/stream.socket");
const logger = (0, logger_1.createLogger)('Server');
const PORT = process.env.PORT || 3000;
// Crear servidor HTTP
const httpServer = (0, http_1.createServer)(app_1.default);
// Inicializar Socket.IO para streaming
const streamSocketManager = new stream_socket_1.StreamSocketManager(httpServer);
logger.info('Socket.IO inicializado para streaming en vivo');
// Exportar el Socket.IO para uso en otros módulos si es necesario
exports.io = streamSocketManager.getIO();
httpServer.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Socket.IO listening on port ${PORT}`);
});
//# sourceMappingURL=server.js.map