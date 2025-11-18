import axios from 'axios';

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
}
