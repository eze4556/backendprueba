"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const history_middlewares_1 = __importDefault(require("../../history/middlewares/history.middlewares"));
const token_1 = __importDefault(require("../../../auth/token/token"));
const user_models_1 = __importDefault(require("../models/user.models"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const handler_helper_1 = __importDefault(require("../../../helpers/handler.helper"));
const codes_constanst_1 = require("../../../constants/codes.constanst");
const user_controllers_1 = __importDefault(require("../controllers/user.controllers"));
const router = (0, express_1.Router)();
// Middleware para verificar credenciales contra la base de datos
async function checkCredentials(req, res, next) {
    try {
        const { email, contraseña } = req.body;
        console.log('checkCredentials - email recibido:', email);
        console.log('checkCredentials - contraseña recibida:', contraseña ? 'EXISTS' : 'MISSING');
        // Validar que se proporcionen email y contraseña
        if (!email || !contraseña) {
            console.log('checkCredentials - faltan email o contraseña');
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.BAD_REQUEST,
                message: 'Email y contraseña son requeridos'
            });
        }
        // Buscar usuario en la base de datos
        console.log('checkCredentials - buscando usuario en BD...');
        const user = await user_models_1.default.findOne({ 'primary_data.email': email.toLowerCase() });
        if (!user) {
            console.log('checkCredentials - usuario no encontrado');
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Credenciales incorrectas'
            });
        }
        console.log('checkCredentials - usuario encontrado, verificando contraseña...');
        // Verificar contraseña usando bcrypt
        const isValidPassword = await bcrypt_1.default.compare(contraseña, user.auth_data.password);
        if (!isValidPassword) {
            console.log('checkCredentials - contraseña incorrecta');
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Credenciales incorrectas'
            });
        }
        console.log('checkCredentials - contraseña válida, verificando estado activo...');
        // Verificar que el usuario esté activo
        if (!user.permissions.active) {
            console.log('checkCredentials - usuario inactivo');
            return handler_helper_1.default.error(res, {
                code: codes_constanst_1.UNAUTHORIZED,
                message: 'Usuario inactivo. Contacta al administrador.'
            });
        }
        console.log('checkCredentials - autenticación exitosa, configurando request...');
        // Agregar datos del usuario al request para el siguiente middleware
        req.body._id = user._id;
        req.body.email = user.primary_data.email;
        req.body.name = user.primary_data.name;
        console.log('checkCredentials - datos configurados:', {
            _id: user._id,
            email: user.primary_data.email,
            name: user.primary_data.name
        });
        next();
    }
    catch (error) {
        console.error('checkCredentials - error:', error);
        return handler_helper_1.default.error(res, {
            code: codes_constanst_1.INTERNAL_ERROR,
            message: 'Error interno del servidor'
        });
    }
}
// Ruta principal de login usando el controlador
router.post('/', user_controllers_1.default.loginUser);
// Ruta alternativa usando middleware (para compatibilidad)
router.post('/middleware', checkCredentials, // Verificar credenciales contra BD
(req, res, next) => {
    history_middlewares_1.default.saveHistory('start session')(req, res, next);
}, // Guardar historial
token_1.default.generateToken // Generar token
);
exports.default = router;
//# sourceMappingURL=login.routes.js.map