/**
 * STREAMING EN VIVO - API REST
 * 
 * Este módulo proporciona las rutas para gestionar streaming en vivo
 * sin dependencias de la nube (AWS). Usa WebRTC y Socket.IO para
 * transmisión peer-to-peer en tiempo real.
 * 
 * Para usar este sistema:
 * 1. Socket.IO debe estar configurado en server.ts
 * 2. El frontend debe conectarse a Socket.IO en el puerto del servidor
 * 3. Usa las rutas definidas en stream.routes.ts para gestión REST
 */

import streamRoutes from './routes/stream.routes';

export default streamRoutes;