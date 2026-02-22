# Component: Layout

## Archivos

- `src/layouts/Layout.astro` - Shell HTML con SEO completo
- `src/pages/index.astro` - Pagina principal (prerenderizada)

## Layout.astro

### Props

```typescript
interface Props {
  title: string;
  description?: string;   // Default: descripcion SEO generica de Fuel Watch
  canonicalURL?: string;   // Default: Astro.url.href
}
```

### Meta Tags SEO

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>{title}</title>

  <!-- SEO -->
  <meta name="description" content="{description}" />
  <meta name="robots" content="index, follow" />
  <meta name="keywords" content="precio gasolina, precio diesel, gasolinera barata, combustible España, gasolina hoy, diesel hoy, comparador gasolineras, precio gasolina 95, precio gasoleo, gasolinera cerca de mi" />
  <link rel="canonical" href="{canonicalURL}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{description}" />
  <meta property="og:url" content="{canonicalURL}" />
  <meta property="og:site_name" content="Fuel Watch" />
  <meta property="og:locale" content="es_ES" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{description}" />

  <!-- Favicon & PWA -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="manifest" href="/manifest.json" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#1f2937" id="meta-theme-color" />

  <meta name="generator" content={Astro.generator} />
</head>
```

### Script inline: Theme Color

Actualiza `<meta name="theme-color">` cuando cambia la clase `astro-dark` en `<html>`:

```javascript
function updateThemeColor() {
  const isDark = document.documentElement.classList.contains('astro-dark');
  const color = isDark ? '#0a0a0a' : '#1f2937';
  document.getElementById('meta-theme-color').setAttribute('content', color);
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') updateThemeColor();
  });
});
observer.observe(document.documentElement, { attributes: true });
window.addEventListener('DOMContentLoaded', updateThemeColor);
```

## index.astro

### Prerender

```astro
---
export const prerender = true;
---
```

La pagina se prerenderiza como HTML estatico. Esto es **critico para SEO**: los crawlers ven el contenido completo sin necesidad de ejecutar JavaScript.

### Estructura

```
<Layout title="Precio Gasolina y Diesel Hoy en España — Fuel Watch" description="...">
  <main>
    <article class="seo-content">        <!-- Contenido estatico indexable -->
      <h1>Precio de gasolina y diesel hoy en España</h1>
      <p>Compara precios... 12.000 gasolineras... Ministerio de Consumo...</p>
      <p>Consulta precios de Gasoleo A, Gasoleo Premium, Gasolina 95, Gasolina 98...</p>
    </article>

    <FuelApp client:load />               <!-- App React interactiva -->

    <section class="seo-faq">            <!-- FAQ para SEO + AEO -->
      <h2>Preguntas frecuentes sobre precios de combustible en España</h2>
      <details>6 preguntas con respuestas</details>
    </section>
  </main>

  <script type="application/ld+json">    <!-- JSON-LD: WebApplication -->
  <script type="application/ld+json">    <!-- JSON-LD: FAQPage -->
</Layout>
```

### Contenido SEO (article.seo-content)

H1 y parrafos con keywords naturales:
- "Precio de gasolina y diesel hoy en España"
- "12.000 gasolineras", "gasolinera mas barata", "Ministerio de Consumo"
- "Gasoleo A (diesel)", "Gasoleo Premium", "Gasolina 95 E5", "Gasolina 98 E5"
- "evolucion de precios", "tendencia"

### FAQ (section.seo-faq)

6 preguntas optimizadas para AEO (Answer Engine Optimization):

1. Como encontrar la gasolinera mas barata cerca de mi
2. Con que frecuencia se actualizan los precios
3. Que tipos de combustible puedo comparar
4. De donde vienen los datos de precios
5. Que significan las flechas junto al precio
6. Puedo guardar mis gasolineras favoritas

### Structured Data (JSON-LD)

**WebApplication**:
```json
{
  "@type": "WebApplication",
  "name": "Fuel Watch",
  "applicationCategory": "UtilitiesApplication",
  "isAccessibleForFree": true,
  "inLanguage": "es",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://fuelwatch.es/?q={search_term_string}"
  }
}
```

**FAQPage**: Las 6 preguntas del FAQ en formato schema.org para rich snippets en Google.

## Archivos estaticos publicos

### robots.txt
```
User-agent: *
Allow: /
Sitemap: https://fuelwatch.es/sitemap-index.xml
```

### llms.txt
Archivo markdown para agentes AI con descripcion completa del servicio, funcionalidades, datos y API publica.

### manifest.json
PWA manifest con nombre, descripcion, iconos y configuracion standalone.

### sitemap-index.xml
Generado automaticamente por `@astrojs/sitemap` en el build.
