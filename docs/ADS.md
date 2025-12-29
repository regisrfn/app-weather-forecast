# Anúncios e slots

Fluxo para definir slots de anúncio e escolher o slot pelo tamanho do criativo:

1. Configure o cliente do AdSense em `.env`:
   ```
   VITE_ADSENSE_CLIENT_ID=ca-pub-5677395868811418
   ```
2. Cadastre os slots com seus tamanhos em `src/config/adSlots.ts` (substitua os `adSlotId` pelos IDs do AdSense).
3. Use o componente `AdSlot` em qualquer view. Ele escolhe o slot pelo tamanho enviado (exato → cabe → responsivo) e respeita as media queries configuradas.

Exemplo de uso:

```vue
<AdSlot size="300x250" />
<AdSlot slotKey="mobile-banner" />
```

Como funciona a escolha do slot:
- Procura correspondência exata de tamanho dentro dos slots permitidos para o viewport atual.
- Se não encontrar, usa o primeiro slot que comporte o tamanho informado.
- Se ainda assim não houver, cai para o slot marcado como responsivo.
