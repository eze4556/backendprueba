import axios from 'axios';

// URL base de la API de Georef Argentina
const GEOREF_API_URL = 'https://apis.datos.gob.ar/georef/api';

interface GeorefProvincia {
  id: string;
  nombre: string;
  centroide: {
    lat: number;
    lon: number;
  };
}

interface GeorefMunicipio {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
  centroide: {
    lat: number;
    lon: number;
  };
}

interface GeorefLocalidad {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
  departamento: {
    id: string;
    nombre: string;
  };
  centroide: {
    lat: number;
    lon: number;
  };
}

interface UbicacionResult {
  id: string;
  nombre: string;
  nombreCompleto: string;
  tipo: 'provincia' | 'municipio' | 'localidad';
  provincia?: string;
  departamento?: string;
}

export class UbicacionesService {
  
  /**
   * Buscar ubicaciones en Argentina usando la API de Georef
   * Combina resultados de provincias, municipios y localidades
   */
  static async buscarUbicaciones(query: string, max: number = 10): Promise<UbicacionResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const resultados: UbicacionResult[] = [];

      // Búsqueda en paralelo de provincias, municipios y localidades
      const [provinciasRes, municipiosRes, localidadesRes] = await Promise.all([
        axios.get(`${GEOREF_API_URL}/provincias`, {
          params: { nombre: query, max: 5 },
          timeout: 5000
        }).catch(() => ({ data: { provincias: [] } })),
        
        axios.get(`${GEOREF_API_URL}/municipios`, {
          params: { nombre: query, max: 5 },
          timeout: 5000
        }).catch(() => ({ data: { municipios: [] } })),
        
        axios.get(`${GEOREF_API_URL}/localidades`, {
          params: { nombre: query, max: 10 },
          timeout: 5000
        }).catch(() => ({ data: { localidades: [] } }))
      ]);

      // Procesar provincias
      if (provinciasRes.data && provinciasRes.data.provincias) {
        provinciasRes.data.provincias.forEach((prov: GeorefProvincia) => {
          resultados.push({
            id: `prov-${prov.id}`,
            nombre: prov.nombre,
            nombreCompleto: prov.nombre,
            tipo: 'provincia'
          });
        });
      }

      // Procesar municipios
      if (municipiosRes.data && municipiosRes.data.municipios) {
        municipiosRes.data.municipios.forEach((mun: GeorefMunicipio) => {
          resultados.push({
            id: `mun-${mun.id}`,
            nombre: mun.nombre,
            nombreCompleto: `${mun.nombre}, ${mun.provincia.nombre}`,
            tipo: 'municipio',
            provincia: mun.provincia.nombre
          });
        });
      }

      // Procesar localidades
      if (localidadesRes.data && localidadesRes.data.localidades) {
        localidadesRes.data.localidades.forEach((loc: GeorefLocalidad) => {
          resultados.push({
            id: `loc-${loc.id}`,
            nombre: loc.nombre,
            nombreCompleto: `${loc.nombre}, ${loc.departamento.nombre}, ${loc.provincia.nombre}`,
            tipo: 'localidad',
            provincia: loc.provincia.nombre,
            departamento: loc.departamento.nombre
          });
        });
      }

      // Limitar resultados al máximo solicitado
      return resultados.slice(0, max);

    } catch (error: any) {
      console.error('Error al buscar ubicaciones en Georef API:', error.message);
      return [];
    }
  }

  /**
   * Obtener provincias de Argentina
   */
  static async obtenerProvincias(): Promise<UbicacionResult[]> {
    try {
      const response = await axios.get(`${GEOREF_API_URL}/provincias`, {
        params: { max: 24 }, // 23 provincias + CABA
        timeout: 5000
      });

      if (response.data && response.data.provincias) {
        return response.data.provincias.map((prov: GeorefProvincia) => ({
          id: `prov-${prov.id}`,
          nombre: prov.nombre,
          nombreCompleto: prov.nombre,
          tipo: 'provincia' as const
        }));
      }

      return [];
    } catch (error: any) {
      console.error('Error al obtener provincias:', error.message);
      return [];
    }
  }

  /**
   * Buscar municipios por provincia
   */
  static async obtenerMunicipiosPorProvincia(provincia: string, max: number = 50): Promise<UbicacionResult[]> {
    try {
      const response = await axios.get(`${GEOREF_API_URL}/municipios`, {
        params: { provincia, max },
        timeout: 5000
      });

      if (response.data && response.data.municipios) {
        return response.data.municipios.map((mun: GeorefMunicipio) => ({
          id: `mun-${mun.id}`,
          nombre: mun.nombre,
          nombreCompleto: `${mun.nombre}, ${mun.provincia.nombre}`,
          tipo: 'municipio' as const,
          provincia: mun.provincia.nombre
        }));
      }

      return [];
    } catch (error: any) {
      console.error('Error al obtener municipios:', error.message);
      return [];
    }
  }
}
