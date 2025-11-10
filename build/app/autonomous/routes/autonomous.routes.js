"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const autonomous_controller_1 = require("../controllers/autonomous.controller");
const role_validation_middleware_1 = require("../../../middleware/role-validation.middleware");
const roles_interface_1 = require("../../../interfaces/roles.interface");
const router = express_1.default.Router();
// Middleware para manejar errores
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Ruta para crear autónomo (PROTEGIDA con validación de roles)
router.post('/', role_validation_middleware_1.extractRoleInfo, role_validation_middleware_1.canModify, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.CREATE_AUTONOMOUS), asyncHandler(autonomous_controller_1.createAutonomous));
// Rutas de consulta (requieren autenticación básica)
router.get('/all', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_AUTONOMOUS), asyncHandler(autonomous_controller_1.getAllAutonomous));
router.get('/', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_AUTONOMOUS), asyncHandler(autonomous_controller_1.getAutonomousRanking));
router.get('/:id', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_AUTONOMOUS), asyncHandler(autonomous_controller_1.getAutonomousById));
router.get('/category/:categoria', role_validation_middleware_1.extractRoleInfo, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.VIEW_AUTONOMOUS), asyncHandler(autonomous_controller_1.getAutonomousByCategory));
// Rutas de modificación (requieren permisos especiales)
router.put('/:id', role_validation_middleware_1.extractRoleInfo, role_validation_middleware_1.canModify, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.EDIT_AUTONOMOUS), asyncHandler(autonomous_controller_1.updateAutonomous));
router.delete('/:id', role_validation_middleware_1.extractRoleInfo, role_validation_middleware_1.canModify, (0, role_validation_middleware_1.requirePermissions)(roles_interface_1.Permission.DELETE_AUTONOMOUS), asyncHandler(autonomous_controller_1.deleteAutonomous));
// Middleware para manejar errores
router.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});
exports.default = router;
//# sourceMappingURL=autonomous.routes.js.map