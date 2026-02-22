# Component: Layout

## Archivos

- `src/layouts/Layout.astro` - Shell HTML
- `src/pages/index.astro` - Pagina principal

## Layout.astro

### Props

```typescript
interface Props {
  title: string;
}
```

### Estructura HTML

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="Fuel Watch - Precios de gasolina en tiempo real" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
    <!-- PWA metas -->
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#1f2937" id="meta-theme-color" />
    <!-- Theme color script (inline) -->
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Script inline: Theme Color

Actualiza `<meta name="theme-color">` cuando cambia la clase `astro-dark` en `<html>`:

```javascript
function updateThemeColor() {
  const isDark = document.documentElement.classList.contains('astro-dark');
  const color = isDark ? '#0a0a0a' : '#1f2937';
  document.getElementById('meta-theme-color').setAttribute('content', color);
}

// MutationObserver para detectar cambios de clase en <html>
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') updateThemeColor();
  });
});
observer.observe(document.documentElement, { attributes: true });
window.addEventListener('DOMContentLoaded', updateThemeColor);
```

### Imports

```astro
---
import '../styles/global.css';
---
```

## index.astro

### Estructura

```astro
---
import Layout from '../layouts/Layout.astro';
import FuelApp from '../components/FuelApp';
---

<Layout title="Fuel Watch - Compara precios de gasolina">
  <main>
    <FuelApp client:load />
  </main>
</Layout>
```

**`client:load`**: Hidrata el componente React inmediatamente al cargar la pagina (no lazy).
