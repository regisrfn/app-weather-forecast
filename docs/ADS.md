# Anúncios e slots (AdSense)

Visão geral
- O componente `<AdSlot>` resolve qual slot usar pelo tamanho pedido (exato → cabe → responsivo) e aplica media queries definidas no slot.
- Se `VITE_ADSENSE_CLIENT_ID` não estiver definido, nada é renderizado (nem o bloco “Patrocinado”).
- Os slots ficam em `src/config/adSlots.ts`. Edite os IDs/tamanhos ali.

Slots configurados hoje (`src/config/adSlots.ts`)
- `leaderboard` → `2549813732` (728x90 / 970x250), desktop.
- `medium-rectangle` → `2230991134` (300x250, 336x280), geral/desktop.
- `mobile-banner` → `6154580818` (320x50, 320x100, 350x50), mobile.
- `responsive-auto` → `1180072844` (responsivo).

Onde está usado
- Sidebar do mapa (`WeatherMap.vue`): `size="300x250"` → pega `medium-rectangle`.
- Detalhe da cidade (`CityDetailView.vue`): `size="300x250"` (aceita 336x280 via mesmo slot).
- Páginas estáticas (Sobre/Privacidade/Termos/Contato): `size="300x250"`.
- Todos os blocos “Patrocinado” só aparecem se o client estiver setado.

Como ativar
1) Defina o client no `.env`:
```
VITE_ADSENSE_CLIENT_ID=ca-pub-5677395868811418
```
2) Confira se os `adSlotId` em `src/config/adSlots.ts` são os IDs do AdSense que você criou. Ajuste tamanhos/media queries conforme necessário.
3) Use o componente:
```vue
<AdSlot size="300x250" />          <!-- escolhe slot pelo tamanho -->
<AdSlot slotKey="mobile-banner" /> <!-- força um slot específico -->
<AdSlot />                          <!-- cai no responsivo -->
```

Lógica de seleção
- Filtra slots cujas media queries casam com o viewport.
- Procura tamanho exato; se não houver, pega o primeiro que comporte o tamanho; se ainda não houver, usa o slot marcado como `responsive`; como último recurso, pega o primeiro disponível.
- Se não encontrar slot ou faltarem configs, o componente não renderiza nada (sem placeholders).

Quer usar só um slot responsivo?
- Deixe apenas `responsive-auto` em `AD_SLOTS` e use `<AdSlot />` ou `slotKey="responsive-auto"`.
