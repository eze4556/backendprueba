"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayment = exports.validateProduct = exports.validateImageFile = exports.sanitizeText = exports.validatePagination = exports.validateId = exports.validateLogin = exports.validateUser = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Errores de validación',
            errors: errors.array().map(error => ({
                field: error.type === 'field' ? error.path : 'unknown',
                message: error.msg,
                value: error.type === 'field' ? error.value : undefined
            }))
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
/**
 * Validaciones comunes para usuarios
 */
exports.validateUser = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password debe contener al menos una letra minúscula, una mayúscula y un número'),
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/)
        .withMessage('Nombre solo puede contener letras y espacios'),
    exports.handleValidationErrors
];
/**
 * Validación para login
 */
exports.validateLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email debe ser válido'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('Password es requerido'),
    exports.handleValidationErrors
];
/**
 * Validación para parámetros de ID
 */
exports.validateId = [
    (0, express_validator_1.param)('id')
        .isMongoId()
        .withMessage('ID debe ser un ObjectId válido de MongoDB'),
    exports.handleValidationErrors
];
/**
 * Validación para paginación
 */
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página debe ser un número entero mayor a 0'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Límite debe ser un número entero entre 1 y 100'),
    exports.handleValidationErrors
];
/**
 * Sanitización de texto general
 */
exports.sanitizeText = [
    (0, express_validator_1.body)('*')
        .if((0, express_validator_1.body)('*').exists())
        .trim()
        .escape(),
    exports.handleValidationErrors
];
/**
 * Validación para archivos de imagen
 */
const validateImageFile = (req, res, next) => {
    if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                message: 'Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP.'
            });
        }
        if (req.file.size > maxSize) {
            return res.status(400).json({
                message: 'Archivo demasiado grande. Máximo 5MB permitido.'
            });
        }
    }
    next();
};
exports.validateImageFile = validateImageFile;
/**
 * Validación para productos
 */
exports.validateProduct = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nombre del producto debe tener entre 2 y 100 caracteres'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Descripción no puede exceder 1000 caracteres'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Precio debe ser un número positivo'),
    (0, express_validator_1.body)('category')
        .optional()
        .isMongoId()
        .withMessage('Categoría debe ser un ID válido'),
    exports.handleValidationErrors
];
/**
 * Validación para pagos
 */
exports.validatePayment = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Monto debe ser mayor a 0'),
    (0, express_validator_1.body)('currency')
        .isIn(['USD', 'EUR', 'MXN'])
        .withMessage('Moneda debe ser USD, EUR o MXN'),
    (0, express_validator_1.body)('paymentMethod')
        .isIn(['card', 'paypal', 'bank_transfer'])
        .withMessage('Método de pago no válido'),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.middleware.js.map