"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professional_controller_1 = require("../controllers/professional.controller");
const token_1 = __importDefault(require("../../../auth/token/token"));
const router = (0, express_1.Router)();
// Obtener todos los profesionales (debe estar ANTES de /:id)
router.get('/', professional_controller_1.obtenerProfesionales);
// Crear nuevo profesional - Ruta principal
router.post('/', token_1.default.verifyToken, professional_controller_1.crearProfesional);
// Crear nuevo profesional - Ruta alternativa para compatibilidad
router.post('/crear', token_1.default.verifyToken, professional_controller_1.crearProfesional);
// Obtener un profesional por ID
router.get('/:id', professional_controller_1.getProfessionalById);
// Actualizar un profesional
router.put('/:id', token_1.default.verifyToken, professional_controller_1.actualizarProfesional);
// Eliminar un profesional
router.delete('/:id', token_1.default.verifyToken, professional_controller_1.eliminarProfesional);
exports.default = router;
//# sourceMappingURL=professional.routes.js.map