"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware para validar los resultados de express-validator
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Ejecutar todas las validaciones
        await Promise.all(validations.map(validation => validation.run(req)));
        // Verificar si hay errores
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        // Si hay errores, enviar respuesta de error
        return res.status(400).json({
            status: 'error',
            statusCode: 400,
            message: 'Error de validación',
            errors: errors.array()
        });
    };
};
exports.validate = validate;
