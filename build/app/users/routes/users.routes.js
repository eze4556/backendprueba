"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmail = void 0;
const express_1 = require("express");
const user_controllers_1 = __importDefault(require("../controllers/user.controllers"));
const code_middlewares_1 = __importDefault(require("../../codes/middlewares/code.middlewares"));
const user_models_1 = __importDefault(require("../models/user.models"));
const multer_config_1 = __importDefault(require("../../../config/multer.config"));
const role_validation_middleware_1 = require("../../../middleware/role-validation.middleware");
const roles_interface_1 = require("../../../interfaces/roles.interface");
const router = (0, express_1.Router)();
// Middleware para verificar que el email no exista en la base de datos
const checkEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        console.log('checkEmail middleware - email received:', email);
        if (!email) {
            console.log('checkEmail middleware - email is missing');
            return res.status(400).json({ message: 'Email is required' });
        }
        console.log('checkEmail middleware - checking database for existing user...');
        // Buscar en la estructura anidada primary_data.email
        const user = await user_models_1.default.findOne({ 'primary_data.email': email.toLowerCase() });
        console.log('checkEmail middleware - user found:', user ? 'YES' : 'NO');
        if (user) {
            console.log('checkEmail middleware - user already exists, rejecting');
            return res.status(409).json({ message: 'Email already exists' });
        }
        console.log('checkEmail middleware - email is available, calling next()');
        next();
    }
    catch (error) {
        console.error('Error in checkEmail middleware:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.checkEmail = checkEmail;
const user_validator_1 = require("../../../middleware/validators/user.validator");
// ... (código existente)
// Solicitud de registro (envía código)
router.post('/register_request', user_validator_1.validateUserRegistration, // <-- Añadido validador
exports.checkEmail, // Verifica que el email no exista
code_middlewares_1.default.sendCode, // Envía código de verificación
(req, res) => {
    console.log('register_request - sending success response');
    res.status(200).json({
        success: true,
        message: 'Verification code sent successfully'
    });
});
// ... (código existente)
// Registro de usuario (con código)
router.post('/register_user', code_middlewares_1.default.checkCode, // Verifica código
user_controllers_1.default.registerUser // Registra usuario
);
// Editar usuario (requiere token y permisos)
router.put('/edit_user', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.EDIT_USER), user_controllers_1.default.editUser);
// Eliminar usuario (solo administradores)
router.delete('/delete_user', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requireSensitiveOperation)('USER_MANAGEMENT'), (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.DELETE_USER), user_controllers_1.default.deleteUser);
// Obtener datos de usuario (requiere autenticación)
router.get('/get_data', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_USER), user_controllers_1.default.getUser);
// Guardar información personal (usuarios pueden editar su propio perfil)
router.post('/personal-info', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.EDIT_USER), user_controllers_1.default.savePersonalInfo);
// Actualizar rol del usuario (solo administradores)
router.put('/update-role', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requireSensitiveOperation)('USER_MANAGEMENT'), role_validation_middleware_1.adminOnly, user_controllers_1.default.updateUserRole);
// Guardar información del perfil de emprendedor (requiere token y multer para archivos)
router.post('/profile/update', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.EDIT_USER), multer_config_1.default.single('profileImage'), user_controllers_1.default.saveProfileInfo);
// Actualizar información de cuenta (usuarios pueden actualizar su cuenta)
router.put('/account-info', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.EDIT_USER), user_controllers_1.default.updateAccountInfo);
// Obtener información del perfil del usuario actual (requiere autenticación)
router.get('/profile', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_USER), user_controllers_1.default.getCurrentUserProfile);
exports.default = router;
//# sourceMappingURL=users.routes.js.map