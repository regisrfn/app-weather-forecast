import type { Municipality } from '../types/municipality';

/**
 * Normaliza string removendo acentos, cedilha e convertendo para minúsculas.
 */
export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, '');
};

/**
 * Aplica a mesma lógica de busca usada no painel detalhado de cidades.
 */
export const searchMunicipalities = (
  municipalities: Municipality[],
  query: string,
  limit = 50
): Municipality[] => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery || trimmedQuery.length < 2) {
    return [];
  }

  const normalizedQuery = normalizeString(trimmedQuery);

  return municipalities
    .filter(city => {
      const normalizedName = normalizeString(city.name);
      const normalizedState = normalizeString(city.state);
      const normalizedStateName = normalizeString(city.state_name);

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedState.includes(normalizedQuery) ||
        normalizedStateName.includes(normalizedQuery)
      );
    })
    .map(city => {
      const normalizedName = normalizeString(city.name);
      const normalizedState = normalizeString(city.state);
      const normalizedStateName = normalizeString(city.state_name);

      let score = 0;

      if (normalizedName === normalizedQuery) score = 1000;
      else if (normalizedName.startsWith(normalizedQuery)) score = 500;
      else if (normalizedName.includes(normalizedQuery)) score = 100;
      else if (normalizedState === normalizedQuery || normalizedStateName === normalizedQuery) score = 50;
      else if (normalizedState.includes(normalizedQuery) || normalizedStateName.includes(normalizedQuery)) score = 10;

      return { city, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.city);
};
