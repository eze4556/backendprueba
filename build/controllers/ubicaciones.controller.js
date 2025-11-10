"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UbicacionesController = void 0;
const ubicaciones_service_1 = require("../services/ubicaciones.service");
class UbicacionesController {
    /**
     * Buscar ubicaciones (provincias, municipios, localidades)
     * GET /api/ubicaciones/search?q=cordoba&max=10
     */
    static async buscarUbicaciones(req, res) {
        try {
            const { q, max = 10 } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    error: 'El parámetro de búsqueda "q" es requerido'
                });
            }
            const resultados = await ubicaciones_service_1.UbicacionesService.buscarUbicaciones(q, Number(max));
            return res.status(200).json({
                success: true,
                resultados,
                total: resultados.length,
                query: q
            });
        }
        catch (error) {
            console.error('Error en búsqueda de ubicaciones:', error);
            return res.status(500).json({
                error: 'Error al buscar ubicaciones',
                details: error.message
            });
        }
    }
    /**
     * Obtener todas las provincias
     * GET /api/ubicaciones/provincias
     */
    static async obtenerProvincias(req, res) {
        try {
            const provincias = await ubicaciones_service_1.UbicacionesService.obtenerProvincias();
            return res.status(200).json({
                success: true,
                provincias,
                total: provincias.length
            });
        }
        catch (error) {
            console.error('Error al obtener provincias:', error);
            return res.status(500).json({
                error: 'Error al obtener provincias',
                details: error.message
            });
        }
    }
    /**
     * Obtener municipios de una provincia
     * GET /api/ubicaciones/municipios?provincia=cordoba&max=50
     */
    static async obtenerMunicipios(req, res) {
        try {
            const { provincia, max = 50 } = req.query;
            if (!provincia || typeof provincia !== 'string') {
                return res.status(400).json({
                    error: 'El parámetro "provincia" es requerido'
                });
            }
            const municipios = await ubicaciones_service_1.UbicacionesService.obtenerMunicipiosPorProvincia(provincia, Number(max));
            return res.status(200).json({
                success: true,
                municipios,
                total: municipios.length,
                provincia
            });
        }
        catch (error) {
            console.error('Error al obtener municipios:', error);
            return res.status(500).json({
                error: 'Error al obtener municipios',
                details: error.message
            });
        }
    }
}
exports.UbicacionesController = UbicacionesController;
//# sourceMappingURL=ubicaciones.controller.js.map