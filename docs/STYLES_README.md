# 🎨 Estrutura de Estilos SASS

Este projeto utiliza SASS (Syntactically Awesome Style Sheets) para organizar os estilos de forma modular e manutenível.

## 📁 Estrutura de Pastas

```
src/styles/
├── abstracts/          # Variáveis, mixins, funções
│   ├── _colors.scss    # Paleta de cores e gradientes
│   ├── _variables.scss # Variáveis globais (espaçamentos, fontes, etc.)
│   ├── _mixins.scss    # Mixins reutilizáveis
│   └── _breakpoints.scss # Media queries e breakpoints
├── base/               # Estilos base e reset
│   └── _reset.scss     # Reset CSS e estilos globais
├── components/         # Estilos por componente
│   ├── _weather-map.scss
│   ├── _header.scss
│   ├── _radius-control.scss
│   ├── _datetime-control.scss
│   ├── _hamburger.scss
│   ├── _legend.scss
│   ├── _info-panel.scss
│   └── _stats-panel.scss
├── main.scss          # Arquivo principal que importa tudo
└── index.scss         # Ponto de entrada
```

## 🎯 Abstracts

### Colors (`_colors.scss`)
Define toda a paleta de cores do projeto:
- Cores primárias e gradientes
- Backgrounds com blur
- Cores de texto
- Cores de borda
- Cores de rainfall (legenda)
- Mixins de gradiente

### Variables (`_variables.scss`)
Variáveis globais para manter consistência:
- **Espaçamentos**: `$spacing-xs` a `$spacing-2xl`
- **Border Radius**: `$radius-xs` a `$radius-full`
- **Font Sizes**: `$font-xs` a `$font-6xl`
- **Font Weights**: `$font-regular`, `$font-semibold`, `$font-bold`, `$font-extrabold`
- **Shadows**: `$shadow-sm` a `$shadow-4xl`
- **Transitions**: `$transition-fast`, `$transition-normal`, `$transition-slow`
- **Z-index**: Níveis de empilhamento organizados

### Mixins (`_mixins.scss`)
Mixins reutilizáveis para padrões comuns:
- `@include flex-center` - Flexbox centralizado
- `@include flex-between` - Flexbox com space-between
- `@include backdrop-blur($amount)` - Efeito de blur
- `@include truncate($max-width)` - Truncar texto
- `@include glass-effect($bg, $blur, $border-opacity)` - Glassmorphism
- `@include button-hover($translate-y, $shadow)` - Hover em botões
- `@include input-base` - Estilo base para inputs
- `@include text-gradient` - Gradiente em texto
- E muitos outros...

### Breakpoints (`_breakpoints.scss`)
Media queries organizadas:
```scss
@include xs { }  // max-width: 320px
@include sm { }  // max-width: 480px
@include md { }  // max-width: 768px
@include lg { }  // max-width: 1024px
@include xl { }  // max-width: 1280px

// Ou min-width
@include min-md { }  // min-width: 769px
```

## 🧩 Components

Cada componente tem seu próprio arquivo SASS:

- **weather-map**: Container principal
- **header**: Cabeçalho flutuante com glassmorphism
- **radius-control**: Slider de controle de raio
- **datetime-control**: Inputs de data/hora
- **hamburger**: Menu hamburger mobile
- **legend**: Legenda de intensidade de chuva
- **info-panel**: Painel de informações expansível
- **stats-panel**: Painel de estatísticas

## 🚀 Como Usar

### Em novos componentes
Se você criar um novo componente, crie um arquivo SASS correspondente:

```scss
// src/styles/components/_novo-componente.scss
@import '../abstracts/colors';
@import '../abstracts/variables';
@import '../abstracts/mixins';
@import '../abstracts/breakpoints';

.novo-componente {
  @include flex-center;
  padding: $spacing-lg;
  background: $bg-dark-primary;
  border-radius: $radius-md;
  
  @include md {
    padding: $spacing-md;
  }
}
```

Depois adicione ao `main.scss`:
```scss
@import './components/novo-componente';
```

### Usando variáveis

```scss
.meu-elemento {
  color: $text-white;
  padding: $spacing-lg;
  border-radius: $radius-md;
  font-size: $font-xl;
  transition: $transition-normal;
  box-shadow: $shadow-lg;
}
```

### Usando mixins

```scss
.card {
  @include glass-effect($bg-dark-primary, 20px, 0.1);
  @include button-hover(-2px, $shadow-2xl);
  
  @include md {
    padding: $spacing-md;
  }
}
```

### Usando gradientes

```scss
.button {
  @include gradient-primary;
  color: $text-white;
  
  &:hover {
    @include gradient-primary-reverse;
  }
}

.text {
  @include text-gradient;
  font-size: $font-3xl;
}
```

## 📱 Responsividade

O projeto usa mobile-first com breakpoints organizados:

```scss
.elemento {
  // Estilo mobile (padrão)
  padding: $spacing-sm;
  
  // Tablet
  @include md {
    padding: $spacing-md;
  }
  
  // Desktop
  @include min-lg {
    padding: $spacing-lg;
  }
}
```

## 🎨 Convenções

1. **Nomes de variáveis**: Use kebab-case com prefixos descritivos
   - `$primary-gradient-start`
   - `$bg-dark-primary`
   - `$text-white`

2. **Classes CSS**: Use kebab-case
   - `.weather-map-container`
   - `.floating-header`
   - `.info-toggle-btn`

3. **Organização**: Sempre importe na ordem correta:
   ```scss
   @import '../abstracts/colors';
   @import '../abstracts/variables';
   @import '../abstracts/mixins';
   @import '../abstracts/breakpoints';
   ```

4. **Comentários**: Use comentários descritivos para seções
   ```scss
   // =================================
   // COMPONENTE: HEADER
   // =================================
   ```

## 🔧 Manutenção

### Adicionando novas cores
Adicione em `_colors.scss`:
```scss
$nova-cor: #ff5733;
```

### Adicionando novos mixins
Adicione em `_mixins.scss`:
```scss
@mixin novo-mixin($param) {
  // Seu código aqui
}
```

### Adicionando novos componentes
1. Crie `_novo-componente.scss` em `components/`
2. Importe em `main.scss`
3. Use as variáveis e mixins disponíveis

## 🎯 Benefícios

✅ **Organização**: Fácil localizar e modificar estilos específicos  
✅ **Reutilização**: Mixins e variáveis evitam código duplicado  
✅ **Manutenção**: Mudanças centralizadas em variáveis  
✅ **Consistência**: Paleta de cores e espaçamentos padronizados  
✅ **Responsividade**: Media queries organizadas e reutilizáveis  
✅ **Performance**: SASS compila para CSS otimizado  
✅ **Legibilidade**: Código mais limpo e semântico

## 📦 Build

O SASS é automaticamente compilado pelo Vite durante o desenvolvimento e build:

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
```
