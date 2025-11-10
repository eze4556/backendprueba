"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dedicated_controller_1 = require("../controllers/dedicated.controller");
const token_1 = __importDefault(require("../../../auth/token/token"));
const validateObjectId_middleware_1 = require("../../../middleware/validateObjectId.middleware");
const router = express_1.default.Router();
// Middleware para manejar errores
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Rutas para manejar solicitudes GET (orden importante)
router.get('/', asyncHandler(dedicated_controller_1.obtenerDedicateds));
router.get('/:id', (0, validateObjectId_middleware_1.validateObjectId)('id'), asyncHandler(dedicated_controller_1.getDedicatedById));
// Ruta para manejar solicitudes POST
router.post('/crear', token_1.default.verifyToken, asyncHandler(dedicated_controller_1.crearDedicated));
// Rutas para manejar solicitudes PUT y DELETE
router.put('/:id', token_1.default.verifyToken, (0, validateObjectId_middleware_1.validateObjectId)('id'), asyncHandler(dedicated_controller_1.actualizarDedicated));
router.delete('/:id', token_1.default.verifyToken, (0, validateObjectId_middleware_1.validateObjectId)('id'), asyncHandler(dedicated_controller_1.eliminarDedicated));
// Middleware para manejar errores
router.use((err, req, res, next) => {
    console.error('Error in dedicated routes:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});
exports.default = router;
//# sourceMappingURL=dedicated.routes.js.map