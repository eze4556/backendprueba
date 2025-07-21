"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmail = void 0;
const express_1 = require("express");
const user_controllers_1 = __importDefault(require("../controllers/user.controllers"));
const code_middlewares_1 = __importDefault(require("../../codes/middlewares/code.middlewares"));
const token_1 = __importDefault(require("../../../auth/token/token"));
const user_models_1 = __importDefault(require("../models/user.models"));
const router = (0, express_1.Router)();
// Middleware para verificar que el email no exista en la base de datos
const checkEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        // Buscar en la estructura anidada primary_data.email
        const user = await user_models_1.default.findOne({ 'primary_data.email': email.toLowerCase() });
        if (user) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        next();
    }
    catch (error) {
        console.error('Error in checkEmail middleware:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.checkEmail = checkEmail;
// Solicitud de registro (envía código)
router.post('/register_request', exports.checkEmail, // Verifica que el email no exista
code_middlewares_1.default.sendCode, // Envía código de verificación
(req, res) => res.status(200).json({ message: 'Verification code sent' }));
// Registro de usuario (con código)
router.post('/register_user', code_middlewares_1.default.checkCode, // Verifica código
user_controllers_1.default.registerUser // Registra usuario
);
// Editar usuario (requiere token)
router.put('/edit_user', token_1.default.verifyToken, user_controllers_1.default.editUser);
// Eliminar usuario (requiere token)
router.delete('/delete_user', token_1.default.verifyToken, user_controllers_1.default.deleteUser);
// Obtener datos de usuario (requiere token)
router.get('/get_data', token_1.default.verifyToken, user_controllers_1.default.getUser);
exports.default = router;
