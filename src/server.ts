// Importa la aplicación principal de Express
import app from './app';
import { createLogger } from './utils/logger';
import { createServer } from 'http';
import { StreamSocketManager } from './live/socket/stream.socket';

const logger = createLogger('Server');
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);
const streamSocketManager = new StreamSocketManager(httpServer);
logger.info('Socket.IO inicializado para streaming en vivo');

export const io = streamSocketManager.getIO();

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Socket.IO listening on port ${PORT}`);
});
