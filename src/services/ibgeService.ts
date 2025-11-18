import axios from 'axios';
import { filterByRadius, type GeoPoint } from '../utils/geoUtils';

const IBGE_API_BASE = 'https://servicodados.ibge.gov.br/api/v1';

export interface IBGEMunicipality {
  id: number;
  nome: string;
  microrregiao: {
    id: number;
    nome: string;
    mesorregiao: {
      id: number;
      nome: string;
      UF: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

export interface MunicipalityWithCoords extends IBGEMunicipality {
  latitude: number;
  longitude: number;
}

// Coordenadas aproximadas dos municípios da região
// Em produção, buscar via API ou banco de dados
const MUNICIPALITY_COORDS: Record<number, { lat: number; lon: number }> = {
  3543204: { lat: -22.7572, lon: -49.9439 }, // Ribeirão do Sul
  3534708: { lat: -22.9789, lon: -49.8708 }, // Ourinhos
  3545407: { lat: -22.8936, lon: -49.9853 }, // Salto Grande
  3550506: { lat: -22.8978, lon: -49.7433 }, // São Pedro do Turvo
  3510153: { lat: -23.0028, lon: -49.7817 }, // Canitar
  3538808: { lat: -23.1933, lon: -49.3847 }, // Piraju
  3546405: { lat: -22.8997, lon: -49.6336 }, // Santa Cruz do Rio Pardo
};

export class IBGEService {
  /**
   * Busca informações do município de Ribeirão do Sul - SP
   */
  static async getRibeiraoDoSulInfo(): Promise<IBGEMunicipality | null> {
    try {
      // Código IBGE de Ribeirão do Sul: 3543204
      const response = await axios.get<IBGEMunicipality>(
        `${IBGE_API_BASE}/localidades/municipios/3543204`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dados de Ribeirão do Sul:', error);
      return null;
    }
  }

  /**
   * Busca municípios vizinhos baseado na microrregião
   */
  static async getNeighboringCities(microregiaoId: number): Promise<IBGEMunicipality[]> {
    try {
      const response = await axios.get<IBGEMunicipality[]>(
        `${IBGE_API_BASE}/localidades/microrregioes/${microregiaoId}/municipios`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar municípios vizinhos:', error);
      return [];
    }
  }

  /**
   * Busca a malha geométrica de um município
   */
  static async getMunicipalityGeometry(municipioId: number): Promise<GeoJSON.Feature | null> {
    try {
      const response = await axios.get<GeoJSON.Feature>(
        `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${municipioId}?formato=application/vnd.geo+json`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar malha do município ${municipioId}:`, error);
      return null;
    }
  }

  /**
   * Retorna lista de municípios da região de Ribeirão do Sul
   * Inclui: Ribeirão do Sul, Ourinhos, Bernardino de Campos, etc.
   */
  static async getRegionalCities(): Promise<IBGEMunicipality[]> {
    // Microrregião de Ourinhos (código: 35040)
    return this.getNeighboringCities(35040);
  }

  /**
   * Busca municípios dentro de um raio específico de distância
   * @param centerLat Latitude do ponto central
   * @param centerLon Longitude do ponto central
   * @param radiusKm Raio em quilômetros
   * @returns Lista de municípios dentro do raio ordenados por distância
   */
  static async getCitiesByRadius(
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): Promise<Array<MunicipalityWithCoords & { distance: number }>> {
    try {
      // Buscar todos os municípios de São Paulo
      const response = await axios.get<IBGEMunicipality[]>(
        `${IBGE_API_BASE}/localidades/estados/SP/municipios`
      );
      
      const municipalities = response.data;
      
      // Adicionar coordenadas aos municípios
      const municipalitiesWithCoords: MunicipalityWithCoords[] = municipalities
        .map(municipality => {
          const coords = MUNICIPALITY_COORDS[municipality.id];
          if (!coords) return null;
          
          return {
            ...municipality,
            latitude: coords.lat,
            longitude: coords.lon,
          };
        })
        .filter((m): m is MunicipalityWithCoords => m !== null);
      
      // Filtrar por raio usando a função de geoUtils
      const centerPoint: GeoPoint = {
        id: 'center',
        latitude: centerLat,
        longitude: centerLon,
      };
      
      return filterByRadius(centerPoint, municipalitiesWithCoords, radiusKm);
    } catch (error) {
      console.error('Erro ao buscar municípios por raio:', error);
      return [];
    }
  }

  /**
   * Busca as coordenadas de um município específico
   */
  static getMunicipalityCoords(municipioId: number): { lat: number; lon: number } | null {
    return MUNICIPALITY_COORDS[municipioId] || null;
  }

  /**
   * Adiciona coordenadas a uma lista de municípios
   */
  static enrichWithCoordinates(municipalities: IBGEMunicipality[]): MunicipalityWithCoords[] {
    return municipalities
      .map(municipality => {
        const coords = MUNICIPALITY_COORDS[municipality.id];
        if (!coords) return null;
        
        return {
          ...municipality,
          latitude: coords.lat,
          longitude: coords.lon,
        };
      })
      .filter((m): m is MunicipalityWithCoords => m !== null);
  }
}
