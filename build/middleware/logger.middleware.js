"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
// Middleware para registrar las solicitudes HTTP y su duración
const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Registrar la entrada de la solicitud
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Guardar el tiempo de inicio para calcular la duración
    res.locals.startTime = start;
    // Cuando la respuesta se complete, mostrar la duración
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=logger.middleware.js.map