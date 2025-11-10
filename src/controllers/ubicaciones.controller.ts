import { Request, Response } from 'express';
import { UbicacionesService } from '../services/ubicaciones.service';

export class UbicacionesController {

  /**
   * Buscar ubicaciones (provincias, municipios, localidades)
   * GET /api/ubicaciones/search?q=cordoba&max=10
   */
  static async buscarUbicaciones(req: Request, res: Response): Promise<Response> {
    try {
      const { q, max = 10 } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          error: 'El parámetro de búsqueda "q" es requerido'
        });
      }

      const resultados = await UbicacionesService.buscarUbicaciones(q, Number(max));

      return res.status(200).json({
        success: true,
        resultados,
        total: resultados.length,
        query: q
      });

    } catch (error: any) {
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
  static async obtenerProvincias(req: Request, res: Response): Promise<Response> {
    try {
      const provincias = await UbicacionesService.obtenerProvincias();

      return res.status(200).json({
        success: true,
        provincias,
        total: provincias.length
      });

    } catch (error: any) {
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
  static async obtenerMunicipios(req: Request, res: Response): Promise<Response> {
    try {
      const { provincia, max = 50 } = req.query;

      if (!provincia || typeof provincia !== 'string') {
        return res.status(400).json({
          error: 'El parámetro "provincia" es requerido'
        });
      }

      const municipios = await UbicacionesService.obtenerMunicipiosPorProvincia(
        provincia,
        Number(max)
      );

      return res.status(200).json({
        success: true,
        municipios,
        total: municipios.length,
        provincia
      });

    } catch (error: any) {
      console.error('Error al obtener municipios:', error);
      return res.status(500).json({
        error: 'Error al obtener municipios',
        details: error.message
      });
    }
  }
}
