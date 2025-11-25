/**
 * Utilitários para manipulação de arrays
 */

/**
 * Divide um array em chunks (blocos) de tamanho máximo especificado
 * 
 * @param array - Array a ser dividido
 * @param chunkSize - Tamanho máximo de cada chunk
 * @returns Array de chunks
 * 
 * @example
 * chunkArray([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * chunkArray([1, 2, 3], 5) // [[1, 2, 3]]
 * chunkArray([], 2) // []
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    throw new Error('chunkSize deve ser maior que 0');
  }
  
  if (array.length === 0) {
    return [];
  }
  
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  return chunks;
}
