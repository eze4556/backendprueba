import { Router } from 'express';
import { UbicacionesController } from '../controllers/ubicaciones.controller';

const router = Router();

/**
 * @route   GET /api/ubicaciones/search
 * @desc    Buscar ubicaciones (provincias, municipios, localidades)
 * @access  Public
 * @query   q: string (término de búsqueda)
 * @query   max: number (cantidad máxima de resultados, default: 10)
 */
router.get('/search', UbicacionesController.buscarUbicaciones);

/**
 * @route   GET /api/ubicaciones/provincias
 * @desc    Obtener todas las provincias de Argentina
 * @access  Public
 */
router.get('/provincias', UbicacionesController.obtenerProvincias);

/**
 * @route   GET /api/ubicaciones/municipios
 * @desc    Obtener municipios de una provincia
 * @access  Public
 * @query   provincia: string (nombre de la provincia)
 * @query   max: number (cantidad máxima, default: 50)
 */
router.get('/municipios', UbicacionesController.obtenerMunicipios);

export default router;
