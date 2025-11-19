# 📏 Guia de Unidades CSS: rem, em, px e vh/vw

## 🎯 Diferenças entre as unidades

### `px` (Pixels)
- **Fixo**: Sempre o mesmo tamanho
- **Uso**: Bordas, ícones pequenos, detalhes precisos
```scss
border: 1px solid; // Sempre 1 pixel
icon-size: 24px;   // Sempre 24 pixels
```

### `rem` (Root EM)
- **Relativo**: Baseado no `font-size` do elemento `<html>` (root)
- **Uso**: Espaçamentos, fontes, layouts responsivos
- **Vantagem**: Muda tudo proporcionalmente quando você ajusta o root
```scss
:root {
  font-size: 16px; // 1rem = 16px
}

padding: 1rem;     // = 16px
font-size: 1.5rem; // = 24px (16 * 1.5)
```

### `em`
- **Relativo**: Baseado no `font-size` do elemento **pai**
- **Uso**: Espaçamentos internos relativos ao texto
- **Cuidado**: Pode multiplicar (efeito cascata)
```scss
.parent {
  font-size: 16px;
  
  .child {
    font-size: 1.5em; // = 24px (16 * 1.5)
    padding: 1em;      // = 24px (relativo ao próprio font-size)
  }
}
```

### `vh` / `vw` (Viewport Height/Width)
- **Relativo**: Baseado no tamanho da janela
- `1vh` = 1% da altura da viewport
- `1vw` = 1% da largura da viewport
```scss
height: 100vh;    // Altura total da tela
width: 50vw;      // Metade da largura da tela
```

---

## 🔄 Como fazer `rem` mudar por breakpoint

### Opção 1: Ajustar o `:root` (IMPLEMENTADO)
```scss
:root {
  // Desktop - 1rem = 16px
  font-size: 16px;
  
  @media (max-width: 768px) {
    // Mobile - 1rem = 14px
    font-size: 14px;
  }
}

// Agora TODOS os rem's diminuem proporcionalmente no mobile!
.element {
  padding: 2rem;  // Desktop: 32px | Mobile: 28px
  font-size: 1rem; // Desktop: 16px | Mobile: 14px
}
```

### Opção 2: Manter `rem` fixo e ajustar valores específicos
```scss
// O rem continua 16px, mas você ajusta manualmente
.element {
  padding: 2rem; // = 32px em todas as telas
  
  @media (max-width: 768px) {
    padding: 1.5rem; // = 24px no mobile (você controla)
  }
}
```

---

## ✅ No seu projeto

### O que foi implementado:
```scss
// src/styles/base/_reset.scss
:root {
  font-size: 16px;    // Desktop: 1rem = 16px
  
  @include lg {
    font-size: 15px;  // Tablet: 1rem = 15px
  }
  
  @include md {
    font-size: 14px;  // Mobile: 1rem = 14px
  }
  
  @include sm {
    font-size: 13px;  // Mobile pequeno: 1rem = 13px
  }
}
```

### Impacto:
Agora **TODAS** as medidas em `rem` no projeto vão diminuir proporcionalmente:

| Elemento | Desktop | Tablet | Mobile | Mobile Pequeno |
|----------|---------|--------|--------|----------------|
| `1rem` | 16px | 15px | 14px | 13px |
| `2rem` | 32px | 30px | 28px | 26px |
| `0.5rem` | 8px | 7.5px | 7px | 6.5px |
| `1.25rem` | 20px | 18.75px | 17.5px | 16.25px |

---

## 🎨 Exemplo Prático

### Antes (sem ajuste de rem):
```scss
.button {
  padding: 1rem 2rem;     // Sempre 16px 32px
  font-size: 1rem;        // Sempre 16px
  border-radius: 0.5rem;  // Sempre 8px
}
```

### Depois (com ajuste de rem):
```scss
.button {
  padding: 1rem 2rem;
  font-size: 1rem;
  border-radius: 0.5rem;
  
  // Desktop: padding 16px 32px, font 16px, radius 8px
  // Mobile:  padding 14px 28px, font 14px, radius 7px
  // ↑ Tudo muda automaticamente!
}
```

---

## 🤔 Quando usar cada unidade?

### Use `rem`:
- ✅ Espaçamentos (padding, margin, gap)
- ✅ Tamanhos de fonte
- ✅ Larguras/alturas de elementos
- ✅ Border radius
- ✅ **Vantagem**: Responsivo automático se ajustar o `:root`

### Use `px`:
- ✅ Bordas finas (1px, 2px)
- ✅ Ícones pequenos
- ✅ Sombras
- ✅ **Vantagem**: Precisão em detalhes

### Use `em`:
- ✅ Padding/margin relativo ao texto do elemento
- ✅ Media queries (alguns preferem)
- ⚠️ **Cuidado**: Efeito cascata pode confundir

### Use `vh/vw`:
- ✅ Altura/largura total da tela
- ✅ Seções full-screen
- ⚠️ **Cuidado**: Barras de navegação móveis podem afetar

### Use `%`:
- ✅ Larguras relativas ao pai
- ✅ Layouts fluidos
- ✅ Grid/Flexbox

---

## 💡 Dica Extra: Fluid Typography

Para fontes que crescem/diminuem suavemente:

```scss
// Mixin no projeto
@mixin fluid-font($min-size, $max-size, $min-width: 320px, $max-width: 1200px) {
  font-size: calc(#{$min-size} + (#{$max-size} - #{$min-size}) * ((100vw - #{$min-width}) / (#{$max-width} - #{$min-width})));
}

// Uso
.title {
  @include fluid-font(1.5rem, 3rem);
  // Cresce de 1.5rem (mobile) até 3rem (desktop) suavemente
}
```

---

## 📊 Comparação Visual

```
Desktop (1rem = 16px):
┌─────────────────────────┐
│  Padding: 2rem (32px)   │
│  ┌───────────────────┐  │
│  │  Font: 1rem (16px)│  │
│  └───────────────────┘  │
└─────────────────────────┘

Mobile (1rem = 14px):
┌───────────────────────┐
│ Padding: 2rem (28px) │
│ ┌─────────────────┐  │
│ │Font: 1rem (14px)│  │
│ └─────────────────┘  │
└───────────────────────┘
```

---

## ✨ Conclusão

Com o ajuste implementado em `_reset.scss`, agora o `rem` **muda automaticamente** por breakpoint! Isso significa:

✅ Menos media queries manuais  
✅ Escala proporcional automática  
✅ Código mais limpo  
✅ Design mais consistente  

Se você **não quiser** que um elemento mude, use `px` em vez de `rem`!
