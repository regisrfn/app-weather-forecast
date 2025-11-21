# Sistema de Cache - Frontend

## Visão Geral

Sistema de cache local implementado no frontend para otimizar o carregamento de dados climáticos ao navegar entre diferentes datas e horários.

## Arquitetura

### 1. Cache Service (`src/services/cacheService.ts`)

Serviço singleton que gerencia cache em memória com as seguintes características:

- **Estrutura de Chave**: `${cityId}_${date}_${time}`
  - Exemplo: `"3550308_2025-11-21_14:00"`
  
- **Cache Regional**: Armazena requisições completas de múltiplas cidades
  - Chave: `regional_${sortedCityIds}_${date}_${time}_${radius}`
  
- **TTL (Time To Live)**: 30 minutos (configurável)
  
- **Limpeza Automática**: Executa a cada 5 minutos para remover entradas expiradas

#### Métodos Principais

```typescript
// Cache Individual
weatherCache.set(cityId, date, time, data)
weatherCache.get(cityId, date, time)
weatherCache.has(cityId, date, time)
weatherCache.remove(cityId, date, time)

// Cache Regional
weatherCache.setRegional(cityIds, date, time, data, radius?)
weatherCache.getRegional(cityIds, date, time, radius?)
weatherCache.hasRegional(cityIds, date, time, radius?)

// Gerenciamento
weatherCache.clear()           // Limpa todo o cache
weatherCache.clearIndividual() // Limpa apenas cache individual
weatherCache.clearRegional()   // Limpa apenas cache regional
weatherCache.getStats()        // Retorna estatísticas
```

### 2. Integração com API Service

O `apiService.ts` foi modificado para:

1. **Verificar cache antes de fazer requisição**
   ```typescript
   const cachedData = weatherCache.getRegional(cityIds, date, time);
   if (cachedData) {
     return { data: cachedData, fromCache: true };
   }
   ```

2. **Armazenar resposta após sucesso**
   ```typescript
   weatherCache.setRegional(cityIds, date, time, response.data);
   return { data: response.data, fromCache: false };
   ```

3. **Retornar flag `fromCache`** para otimizar UX (evitar loading desnecessário)

### 3. Otimizações de UX

#### Loading Inteligente
- **Cache HIT**: Sem loading overlay (carregamento instantâneo)
- **Cache MISS**: Loading overlay completo com animação

#### Botão de Reload
- Localização: Header do mapa, ao lado dos controles de data/hora
- Funcionalidade: 
  - Limpa todo o cache
  - Força nova requisição à API
  - Ícone animado durante loading
- Visual: Ícone de refresh com animação de rotação ao hover

## Comportamento

### Navegação Entre Datas

**Primeira Visualização:**
```
Usuário seleciona 21/11 14:00
→ Cache MISS
→ Loading overlay exibido
→ Requisição à API
→ Dados armazenados no cache
→ Exibe dados
```

**Navegação de Volta:**
```
Usuário volta para 21/11 14:00
→ Cache HIT
→ SEM loading overlay
→ Dados exibidos instantaneamente
```

### Mudança de Raio

Quando o usuário altera o raio de busca:
- Cache é verificado para a nova combinação de cidades
- Se não houver cache para aquele raio, faz nova requisição

### Reload Manual

Botão de reload permite ao usuário:
- Forçar atualização dos dados
- Limpar cache completo
- Útil para garantir dados mais recentes

## Logs de Debug

O sistema registra logs no console para facilitar debug:

```javascript
[Cache HIT] Dados regionais para 15 cidades em 2025-11-21 14:00
[Cache MISS] Buscando dados regionais da API para 15 cidades
[Cache] Limpando cache e recarregando dados...
```

## Benefícios

1. **Performance**: Navegação instantânea entre datas já visitadas
2. **Economia de Banda**: Reduz chamadas duplicadas à API
3. **UX Melhorada**: Elimina loading desnecessário ao revisitar dados
4. **Responsividade**: Interface mais fluida e responsiva
5. **Redução de Custos**: Menos requisições ao backend/Lambda

## Configuração

Para ajustar o TTL do cache, modifique a constante em `cacheService.ts`:

```typescript
private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutos
```

Para ajustar a frequência de limpeza:

```typescript
setInterval(() => this.cleanup(), 5 * 60 * 1000); // 5 minutos
```

## Considerações Futuras

### Persistência
- **Opção**: Usar `localStorage` ou `sessionStorage`
- **Prós**: Mantém cache entre recargas de página
- **Contras**: Requer serialização/desserialização, limites de tamanho
- **Decisão**: Não implementado por enquanto para manter simplicidade

### Cache de Vizinhos
- Atualmente apenas dados climáticos são cacheados
- Cidades vizinhas poderiam também ser cacheadas por raio
- Requer análise de custo-benefício (dados raramente mudam)

### Indicador Visual
- Mostrar ícone diferente quando dados vêm do cache
- Adiciona transparência para o usuário
- Requer design e implementação de UI adicional
