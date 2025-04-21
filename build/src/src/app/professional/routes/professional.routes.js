"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professional_controller_1 = require("../controllers/professional.controller");
const token_1 = __importDefault(require("../../../auth/token/token"));
const router = (0, express_1.Router)();
// Ruta para manejar solicitudes POST
router.post('/', (req, res) => {
    const { name, profession } = req.body;
    // Lógica para manejar los datos recibidos
    res.status(201).json({ message: 'Profesional creado', data: { name, profession } });
});
// Crear nuevo profesional
router.post('/crear', token_1.default.verifyToken, professional_controller_1.crearProfesional);
// Obtener todos los profesionales
router.get('/', professional_controller_1.obtenerProfesionales);
router.get('/:id', professional_controller_1.getProfessionalById);
// Actualizar un profesional
router.put('/:id', token_1.default.verifyToken, professional_controller_1.actualizarProfesional);
// Eliminar un profesional
router.delete('/:id', token_1.default.verifyToken, professional_controller_1.eliminarProfesional);
exports.default = router;
