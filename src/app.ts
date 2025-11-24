// Importacion de modulos principales de Express y utilidades
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bodyParser from 'body-parser'; 
import path from 'path';
import cors from 'cors';

// ConfiguraciÃ³n de producciÃ³n
import { productionConfig, validateProductionConfig } from './config/production.config';

// Validar configuracion en produccion
if (process.env.NODE_ENV === 'production') {
  validateProductionConfig();
}

// Importacion de rutas de los diferentes modulos de la aplicacion
import usersRoutes from './app/users/routes/users.routes';
import codesRoutes from './app/codes/routes/code.routes';
import loginRoutes from './app/users/routes/login.routes';
import passwordRoutes from './app/users/routes/password.routes';
import categoriesRoutes from './app/categories/routes/categorie.routes';
import mediaRoutes from './app/media/routes/media.routes';
import vehicleRoutes from './app/vehicles/routes/vehicle.routes';
import professionalRoutes from './app/professional/routes/professional.routes';
import productTypeRoutes from './app/productTypes/routes/productType.routes';
import autonomousRoutes from './app/autonomous/routes/autonomous.routes';
import dedicatedRoutes from './app/dedicated/routes/dedicated.routes';
import rankingRoutes from './app/ranking/routes/ranking.routes';
import paymentRoutes from './app/payment/routes/payment.routes';
import { paymentWebhookRoutes } from './app/payment/controllers/payment-webhook.controller';
import setCalculatorRoutes from './app/calculator/routes/calculatorRoutes';
import subscriptionRoutes from './app/subscripcion/routes/subscription.routes'; 
import providerRoutes from './app/proveedores/routes/provider.routes';
import streamRoutes from './live/stream';
import ubicacionesRoutes from './routes/ubicaciones.routes';
import orderRoutes from "./app/orders/routes/order.routes";
import billingRoutes from './app/billing/routes/billing.routes';
import tokenRoutes from './routes/token.routes';
import cartRoutes from './app/orders/routes/cart.routes';
import notificationRoutes from './app/users/routes/notification.routes';
import reviewRoutes from './app/productTypes/routes/review.routes';
import wishlistRoutes from './app/users/routes/wishlist.routes';
import searchRoutes from './app/search/routes/search.routes';
import reservationRoutes from './app/professional/routes/reservation.routes';
import mediaUploadRoutes from './app/media/routes/media-upload.routes';
import messagingRoutes from './app/users/routes/messaging.routes';
import { healthCheck, livenessProbe, readinessProbe, productionHealthCheck, metricsEndpoint } from './routes/health.routes';
import { testEndpoint } from './controllers/test.controller';
import { BotDetectionMiddleware } from './middleware/bot-detection.middleware';
import streamingPreferencesRoutes from './live/routes/streamingPreferences.routes';
import { 
  auditLogMiddleware, 
  rateLimitMiddleware, 
  botDetectionMiddleware,
  noSQLSanitizeMiddleware,
  xssSanitizeMiddleware,
  geoBlockingMiddleware,
  securityHeadersMiddleware,
  inputValidationMiddleware
} from './middleware/security-advanced.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { AuthRequest } from './interfaces/auth.interface';

// Importacion y conexion a la base de datos
import './database/database';

// Inicializacion de la aplicacion Express
const app = express();

// Configuracion del puerto
app.set('port', productionConfig.port);

// ---------- CORS CONFIGURADO POR ENTORNO ----------
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? productionConfig.security.corsOrigin 
    : true, // Permitir todos los orÃ­genes en desarrollo
  credentials: productionConfig.security.corsCredentials,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

// Preflight para todas las rutas
app.options('*', cors());

// ---------- MIDDLEWARE BASICO ----------
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- MIDDLEWARE DE SEGURIDAD (ORDEN IMPORTANTE) ----------
// 1. Headers de seguridad primero
app.use(securityHeadersMiddleware);

// 2. Rate limiting para prevenir ataques de fuerza bruta
app.use(rateLimitMiddleware({
  windowMs: productionConfig.security.rateLimitWindowMs,
  maxRequests: productionConfig.security.rateLimitMaxRequests
}));

// 3. Sanitizacion de entrada antes de procesamiento
app.use(noSQLSanitizeMiddleware);
app.use(xssSanitizeMiddleware);
app.use(inputValidationMiddleware());

// 4. Deteccion de bots (multiples implementaciones)
if (productionConfig.security.botDetectionEnabled) {
  app.use(BotDetectionMiddleware.detectBot);
  app.use(botDetectionMiddleware);
}

// 5. Geo-blocking si estÃ¡ habilitado
if (productionConfig.security.geoBlockingEnabled) {
  app.use(geoBlockingMiddleware(productionConfig.security.blockedCountries));
}

// 6. Auditoria de todas las requests
app.use(auditLogMiddleware);

// ---------- RUTAS BASICAS ----------
app.get('/', (_req: Request, res: Response) => res.status(200).send('API OK'));
app.get('/favicon.ico', (_req: Request, res: Response) => res.status(204).end());

// Health check endpoints
if (process.env.NODE_ENV === 'production') {
  // Health checks completos para producciÃ³n
  app.get('/health', productionHealthCheck);
  app.get('/health/live', livenessProbe);
  app.get('/health/ready', readinessProbe);
  app.get('/metrics', metricsEndpoint);
  app.get('/status', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'production'
    });
  });
} else {
  // Health checks basicos para desarrollo
  app.get('/health', healthCheck);
  app.get('/health/live', livenessProbe);
  app.get('/health/ready', readinessProbe);
}
app.get('/test', testEndpoint);

// ---------- RUTAS DE LA API ----------
app.use('/api/code', codesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/auth', tokenRoutes); // Rutas de refresh token y logout
app.use('/api/categorie', categoriesRoutes); // Ahora público
app.use('/api/cart', cartRoutes); // Carrito de compras
app.use('/api/wishlist', wishlistRoutes); // Lista de deseos con alertas de precio
app.use('/api/search', searchRoutes); // Búsqueda global avanzada
app.use('/api/ubicaciones', ubicacionesRoutes); // API de búsqueda de ubicaciones (Georef AR)
app.use('/api/reservation', reservationRoutes); // Sistema de reservas con disponibilidad
app.use('/api/notifications', notificationRoutes); // Sistema de notificaciones
app.use('/api/messages', messagingRoutes); // Sistema de mensajerÃ­a con Socket.IO
app.use('/api/reviews', reviewRoutes); // Sistema de reviews y calificaciones
app.use('/api/media', mediaRoutes);
app.use('/api/media-upload', mediaUploadRoutes); // Upload con optimizacion Sharp
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/professional', professionalRoutes);
app.use('/api/productType', productTypeRoutes);
app.use('/api/autonomous', autonomousRoutes);
app.use('/api/dedicated', dedicatedRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payment/webhooks', paymentWebhookRoutes);
app.use('/api/calculator', setCalculatorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/order', orderRoutes); // Sistema de ordenes completo
app.use('/api/billing', billingRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/streaming-preferences', streamingPreferencesRoutes);

app.get('/api/public-endpoint', (req: Request, res: Response) => {
  res.json({ message: 'Endpoint pÃºblico accedido' });
});

app.get('/api/rate-limit-test', (req: Request, res: Response) => {
  res.json({ message: 'Endpoint especÃ­fico para test de rate limiting' });
});

export default app;

