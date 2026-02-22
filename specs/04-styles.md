# 04 - Sistema de Estilos

## Archivo: `src/styles/global.css`

### Tailwind v4 Config

Tailwind v4 se configura directamente en CSS (no hay `tailwind.config.js`):

```css
@import "tailwindcss";

@theme {
  --color-primary: #f59e0b;       /* Amber/dorado - acento principal */
  --color-secondary: #1f2937;     /* Gris oscuro - textos y sidebar */
  --breakpoint-desk: 800px;       /* Breakpoint custom para desktop */
}
```

### Dark Mode

Se usa un custom variant `astro-dark` en vez del `dark:` nativo de Tailwind:

```css
@custom-variant astro-dark (&:where(.astro-dark, .astro-dark *));
```

**Mecanismo**: Se agrega/quita la clase `astro-dark` en `<html>` via JavaScript.

Uso en componentes:
```html
<div class="bg-white astro-dark:bg-[#151515]">
<span class="text-secondary astro-dark:text-white">
```

### Colores del tema

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#f59e0b` | Botones activos, acentos, filtros seleccionados |
| `secondary` | `#1f2937` | Sidebar background, textos principales |
| Light bg | `bg-gray-50` | Fondo general modo claro |
| Dark bg | `bg-[#0a0a0a]` | Fondo general modo oscuro |
| Card bg light | `bg-white` | Fondo de tarjetas |
| Card bg dark | `bg-[#151515]` | Fondo de tarjetas dark |
| Sidebar dark bg | `bg-[#1a1a1a]` | Dropdowns en sidebar |

### Colores semanticos (precios)

| Contexto | Color | Clase |
|----------|-------|-------|
| Precio barato (barra <30%) | Verde | `bg-green-500` |
| Precio medio (barra 30-70%) | Primary (amber) | `bg-primary` |
| Precio caro (barra >70%) | Rojo | `bg-red-500` |
| Tendencia subida | Rojo | `text-red-500` |
| Tendencia bajada | Verde | `text-green-500` |
| Tendencia estable | Gris | `text-gray-300` |

### Colores de marcas (iconos de estacion)

| Marca | Fondo | Texto |
|-------|-------|-------|
| REPSOL | `bg-orange-50` / `bg-orange-500/10` | `text-orange-500` |
| CEPSA | `bg-red-50` / `bg-red-500/10` | `text-red-500` |
| BP | `bg-green-50` / `bg-green-500/10` | `text-green-500` |
| Otras | `bg-gray-50` / `bg-white/5` | `text-gray-400` |

### Colores del chart (PriceChart)

| Combustible | Color | Grosor |
|-------------|-------|--------|
| Diesel | `#3b82f6` (blue-500) | 3px |
| Diesel Extra | `#1d4ed8` (blue-700) | 2px |
| Gasolina 95 | `#f59e0b` (amber-500) | 3px |
| Gasolina 98 | `#b45309` (amber-700) | 2px |

### Animacion

```css
@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-cascade {
  animation: slideIn 0.4s ease-out forwards;
  opacity: 0;
}
```

Uso: Cada `StationCard` tiene `animate-cascade` con un `animationDelay` escalonado:
```
delay = (index % 20) * 0.05s
```

### Body styles

```css
body { @apply bg-gray-50 text-gray-900 transition-colors duration-300; }
.astro-dark body { @apply bg-[#0a0a0a] text-gray-100; }
```

### Breakpoint responsive

- **Mobile**: `< 800px` (por defecto)
- **Desktop**: `>= 800px` (prefijo `desk:`)

Ejemplos:
```html
<div class="flex-col desk:flex-row">           <!-- stack mobile, row desktop -->
<div class="p-4 desk:p-8">                     <!-- padding menor en mobile -->
<div class="text-sm desk:text-base">           <!-- texto menor en mobile -->
<button class="desk:hidden">                   <!-- solo mobile -->
<div class="hidden desk:flex">                 <!-- solo desktop -->
```

### Theme color (meta tag)

El `<meta name="theme-color">` se actualiza dinamicamente via MutationObserver:
- Light mode: `#1f2937` (secondary)
- Dark mode: `#0a0a0a`
