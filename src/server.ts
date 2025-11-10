// Importa la aplicación principal de Express
import app from './app';
import { createLogger } from './utils/logger';
import { createServer } from 'http';
import { StreamSocketManager } from './live/socket/stream.socket';

const logger = createLogger('Server');
const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const httpServer = createServer(app);

// Inicializar Socket.IO para streaming
const streamSocketManager = new StreamSocketManager(httpServer);
logger.info('Socket.IO inicializado para streaming en vivo');

// Exportar el Socket.IO para uso en otros módulos si es necesario
export const io = streamSocketManager.getIO();

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Socket.IO listening on port ${PORT}`);
});
