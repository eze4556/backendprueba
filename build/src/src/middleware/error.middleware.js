"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.ApiError = void 0;
// Clase personalizada para errores de la API
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Middleware para manejar errores
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Si es un ApiError, usamos su código de estado
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            message: err.message,
            status: 'error',
            statusCode: err.statusCode
        });
    }
    // Para errores no controlados
    return res.status(500).json({
        message: 'Error interno del servidor',
        status: 'error',
        statusCode: 500
    });
};
exports.errorHandler = errorHandler;
// Middleware para rutas no encontradas
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        message: `Ruta no encontrada: ${req.originalUrl}`,
        status: 'error',
        statusCode: 404
    });
};
exports.notFoundHandler = notFoundHandler;
