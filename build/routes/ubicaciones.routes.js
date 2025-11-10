"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ubicaciones_controller_1 = require("../controllers/ubicaciones.controller");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/ubicaciones/search
 * @desc    Buscar ubicaciones (provincias, municipios, localidades)
 * @access  Public
 * @query   q: string (término de búsqueda)
 * @query   max: number (cantidad máxima de resultados, default: 10)
 */
router.get('/search', ubicaciones_controller_1.UbicacionesController.buscarUbicaciones);
/**
 * @route   GET /api/ubicaciones/provincias
 * @desc    Obtener todas las provincias de Argentina
 * @access  Public
 */
router.get('/provincias', ubicaciones_controller_1.UbicacionesController.obtenerProvincias);
/**
 * @route   GET /api/ubicaciones/municipios
 * @desc    Obtener municipios de una provincia
 * @access  Public
 * @query   provincia: string (nombre de la provincia)
 * @query   max: number (cantidad máxima, default: 50)
 */
router.get('/municipios', ubicaciones_controller_1.UbicacionesController.obtenerMunicipios);
exports.default = router;
//# sourceMappingURL=ubicaciones.routes.js.map