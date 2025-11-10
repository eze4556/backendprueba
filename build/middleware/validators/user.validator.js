"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserRegistration = void 0;
const express_validator_1 = require("express-validator");
exports.validateUserRegistration = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Debe proporcionar un correo electrónico válido.')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('La contraseña debe tener al menos 8 caracteres.')
        .trim()
        .escape(),
    (0, express_validator_1.body)('name')
        .not()
        .isEmpty()
        .withMessage('El nombre es requerido.')
        .trim()
        .escape(),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];
//# sourceMappingURL=user.validator.js.map