"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const autonomous_controller_1 = require("../controllers/autonomous.controller");
const router = express_1.default.Router();
// Middleware para manejar errores
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Ruta para manejar solicitudes POST
router.post('/', asyncHandler(autonomous_controller_1.createAutonomous));
// Rutas para manejar solicitudes GET
router.get('/all', asyncHandler(autonomous_controller_1.getAllAutonomous));
router.get('/', asyncHandler(autonomous_controller_1.getAutonomousRanking));
router.get('/:id', asyncHandler(autonomous_controller_1.getAutonomousById));
router.get('/category/:categoria', asyncHandler(autonomous_controller_1.getAutonomousByCategory));
// Rutas para manejar solicitudes PUT y DELETE
router.put('/:id', asyncHandler(autonomous_controller_1.updateAutonomous));
router.delete('/:id', asyncHandler(autonomous_controller_1.deleteAutonomous));
// Middleware para manejar errores
router.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});
exports.default = router;
