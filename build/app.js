"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ImportaciÃ³n de mÃ³dulos principales de Express y utilidades
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
// ConfiguraciÃ³n de producciÃ³n
const production_config_1 = require("./config/production.config");
// Validar configuraciÃ³n en producciÃ³n
if (process.env.NODE_ENV === 'production') {
    (0, production_config_1.validateProductionConfig)();
}
// ImportaciÃ³n de rutas de los diferentes mÃ³dulos de la aplicaciÃ³n
const users_routes_1 = __importDefault(require("./app/users/routes/users.routes"));
const code_routes_1 = __importDefault(require("./app/codes/routes/code.routes"));
const login_routes_1 = __importDefault(require("./app/users/routes/login.routes"));
const password_routes_1 = __importDefault(require("./app/users/routes/password.routes"));
const categorie_routes_1 = __importDefault(require("./app/categories/routes/categorie.routes"));
const media_routes_1 = __importDefault(require("./app/media/routes/media.routes"));
const vehicle_routes_1 = __importDefault(require("./app/vehicles/routes/vehicle.routes"));
const professional_routes_1 = __importDefault(require("./app/professional/routes/professional.routes"));
const productType_routes_1 = __importDefault(require("./app/productTypes/routes/productType.routes"));
const autonomous_routes_1 = __importDefault(require("./app/autonomous/routes/autonomous.routes"));
const dedicated_routes_1 = __importDefault(require("./app/dedicated/routes/dedicated.routes"));
const ranking_routes_1 = __importDefault(require("./app/ranking/routes/ranking.routes"));
const payment_routes_1 = __importDefault(require("./app/payment/routes/payment.routes"));
const payment_webhook_controller_1 = require("./app/payment/controllers/payment-webhook.controller");
const calculatorRoutes_1 = __importDefault(require("./app/calculator/routes/calculatorRoutes"));
const subscription_routes_1 = __importDefault(require("./app/subscripcion/routes/subscription.routes"));
const provider_routes_1 = __importDefault(require("./app/proveedores/routes/provider.routes"));
const stream_1 = __importDefault(require("./live/stream"));
const ubicaciones_routes_1 = __importDefault(require("./routes/ubicaciones.routes"));
const order_routes_1 = __importDefault(require("./app/orders/routes/order.routes"));
const billing_routes_1 = __importDefault(require("./app/billing/routes/billing.routes"));
const token_routes_1 = __importDefault(require("./routes/token.routes"));
const cart_routes_1 = __importDefault(require("./app/orders/routes/cart.routes"));
const notification_routes_1 = __importDefault(require("./app/users/routes/notification.routes"));
const review_routes_1 = __importDefault(require("./app/productTypes/routes/review.routes"));
const wishlist_routes_1 = __importDefault(require("./app/users/routes/wishlist.routes"));
const search_routes_1 = __importDefault(require("./app/search/routes/search.routes"));
const reservation_routes_1 = __importDefault(require("./app/professional/routes/reservation.routes"));
const media_upload_routes_1 = __importDefault(require("./app/media/routes/media-upload.routes"));
const messaging_routes_1 = __importDefault(require("./app/users/routes/messaging.routes"));
const health_routes_1 = require("./routes/health.routes");
const test_controller_1 = require("./controllers/test.controller");
const bot_detection_middleware_1 = require("./middleware/bot-detection.middleware");
const streamingPreferences_routes_1 = __importDefault(require("./live/routes/streamingPreferences.routes"));
const security_advanced_middleware_1 = require("./middleware/security-advanced.middleware");
// ImportaciÃ³n y conexiÃ³n a la base de datos
require("./database/database");
// InicializaciÃ³n de la aplicaciÃ³n Express
const app = (0, express_1.default)();
// ConfiguraciÃ³n del puerto
app.set('port', production_config_1.productionConfig.port);
// ---------- CORS CONFIGURADO POR ENTORNO ----------
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? production_config_1.productionConfig.security.corsOrigin
        : true, // Permitir todos los orÃ­genes en desarrollo
    credentials: production_config_1.productionConfig.security.corsCredentials,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};
app.use((0, cors_1.default)(corsOptions));
// Preflight para todas las rutas
app.options('*', (0, cors_1.default)());
// ---------- MIDDLEWARE BÃSICO ----------
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(body_parser_1.default.json({ limit: '50mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// ---------- MIDDLEWARE DE SEGURIDAD (ORDEN IMPORTANTE) ----------
// 1. Headers de seguridad primero
app.use(security_advanced_middleware_1.securityHeadersMiddleware);
// 2. Rate limiting para prevenir ataques de fuerza bruta
app.use((0, security_advanced_middleware_1.rateLimitMiddleware)({
    windowMs: production_config_1.productionConfig.security.rateLimitWindowMs,
    maxRequests: production_config_1.productionConfig.security.rateLimitMaxRequests
}));
// 3. SanitizaciÃ³n de entrada antes de procesamiento
app.use(security_advanced_middleware_1.noSQLSanitizeMiddleware);
app.use(security_advanced_middleware_1.xssSanitizeMiddleware);
app.use((0, security_advanced_middleware_1.inputValidationMiddleware)());
// 4. DetecciÃ³n de bots (mÃºltiples implementaciones)
if (production_config_1.productionConfig.security.botDetectionEnabled) {
    app.use(bot_detection_middleware_1.BotDetectionMiddleware.detectBot);
    app.use(security_advanced_middleware_1.botDetectionMiddleware);
}
// 5. Geo-blocking si estÃ¡ habilitado
if (production_config_1.productionConfig.security.geoBlockingEnabled) {
    app.use((0, security_advanced_middleware_1.geoBlockingMiddleware)(production_config_1.productionConfig.security.blockedCountries));
}
// 6. AuditorÃ­a de todas las requests
app.use(security_advanced_middleware_1.auditLogMiddleware);
// ---------- RUTAS BÃSICAS ----------
app.get('/', (_req, res) => res.status(200).send('API OK'));
app.get('/favicon.ico', (_req, res) => res.status(204).end());
// Health check endpoints
if (process.env.NODE_ENV === 'production') {
    // Health checks completos para producciÃ³n
    app.get('/health', health_routes_1.productionHealthCheck);
    app.get('/health/live', health_routes_1.livenessProbe);
    app.get('/health/ready', health_routes_1.readinessProbe);
    app.get('/metrics', health_routes_1.metricsEndpoint);
    app.get('/status', (_req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: 'production'
        });
    });
}
else {
    // Health checks bÃ¡sicos para desarrollo
    app.get('/health', health_routes_1.healthCheck);
    app.get('/health/live', health_routes_1.livenessProbe);
    app.get('/health/ready', health_routes_1.readinessProbe);
}
app.get('/test', test_controller_1.testEndpoint);
// ---------- RUTAS DE LA API ----------
app.use('/api/code', code_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/login', login_routes_1.default);
app.use('/api/password', password_routes_1.default);
app.use('/api/auth', token_routes_1.default); // Rutas de refresh token y logout
app.use('/api/categorie', categorie_routes_1.default); // Ahora pÃºblico
app.use('/api/cart', cart_routes_1.default); // Carrito de compras
app.use('/api/wishlist', wishlist_routes_1.default); // Lista de deseos con alertas de precio
app.use('/api/search', search_routes_1.default); // Búsqueda global avanzada
app.use('/api/ubicaciones', ubicaciones_routes_1.default); // API de búsqueda de ubicaciones (Georef AR)
app.use('/api/reservation', reservation_routes_1.default); // Sistema de reservas con disponibilidad
app.use('/api/notifications', notification_routes_1.default); // Sistema de notificaciones
app.use('/api/messages', messaging_routes_1.default); // Sistema de mensajerÃ­a con Socket.IO
app.use('/api/reviews', review_routes_1.default); // Sistema de reviews y calificaciones
app.use('/api/media', media_routes_1.default);
app.use('/api/media-upload', media_upload_routes_1.default); // Upload con optimizaciÃ³n Sharp
app.use('/api/vehicle', vehicle_routes_1.default);
app.use('/api/professional', professional_routes_1.default);
app.use('/api/productType', productType_routes_1.default);
app.use('/api/autonomous', autonomous_routes_1.default);
app.use('/api/dedicated', dedicated_routes_1.default);
app.use('/api/ranking', ranking_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
app.use('/api/payment/webhooks', payment_webhook_controller_1.paymentWebhookRoutes);
app.use('/api/calculator', calculatorRoutes_1.default);
app.use('/api/subscription', subscription_routes_1.default);
app.use('/api/providers', provider_routes_1.default);
app.use('/api/order', order_routes_1.default); // Sistema de Ã³rdenes completo
app.use('/api/billing', billing_routes_1.default);
app.use('/api/stream', stream_1.default);
app.use('/api/streaming-preferences', streamingPreferences_routes_1.default);
app.get('/api/public-endpoint', (req, res) => {
    res.json({ message: 'Endpoint pÃºblico accedido' });
});
app.get('/api/rate-limit-test', (req, res) => {
    res.json({ message: 'Endpoint especÃ­fico para test de rate limiting' });
});
exports.default = app;
//# sourceMappingURL=app.js.map