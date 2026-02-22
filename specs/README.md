# Fuel Watch - Especificaciones (Spec-Driven Design)

Documentacion completa del proyecto Fuel Watch. Estas especificaciones son la **fuente de verdad** del proyecto y son suficientes para reconstruir todo el codigo funcional mediante agentes AI (Claude Code).

---

## Que es Spec-Driven Design

En este proyecto, las specs mandan y el codigo es derivado. El flujo de trabajo es:

```
Spec (se escribe/edita) --> Generador (Claude Code) --> Codigo fuente
```

**Nunca** se modifica el codigo directamente sin actualizar la spec correspondiente. Si necesitas cambiar comportamiento, edita la spec primero y luego regenera.

---

## Indice de Specs

### Fundamentos
| Spec | Descripcion |
|------|-------------|
| [01 - Arquitectura](./01-architecture.md) | Stack, estructura de carpetas, deployment |
| [02 - Modelo de Datos](./02-data-model.md) | Entidades, esquema Supabase, tipos TypeScript |
| [03 - Configuracion](./03-config.md) | Astro, Tailwind, Cloudflare, env vars, CI/CD |
| [04 - Estilos](./04-styles.md) | Sistema de diseno: colores, breakpoints, dark mode, animaciones |

### API Endpoints
| Spec | Ruta | Descripcion |
|------|------|-------------|
| [Search](./api/search.md) | `GET /api/search` | Busqueda de estaciones con paginacion |
| [History](./api/history.md) | `GET /api/history` | Historico de precios de una estacion |
| [Stats](./api/stats.md) | `GET /api/stats` | Estadisticas min/max/avg por localidad |
| [Suggestions](./api/suggestions.md) | `GET /api/suggestions` | Autocompletado de localidades |
| [Update Prices](./api/update-prices.md) | `GET /api/update-prices` | Sincronizacion con API del Ministerio |

### Servicios (Logica de Negocio)
| Spec | Descripcion |
|------|-------------|
| [Supabase Client](./services/supabase-client.md) | Configuracion del cliente Supabase |
| [Fuel Service](./services/fuel-service.md) | Funciones principales: search, trends, stats, sync |
| [Search Conditions](./services/search-conditions.md) | Algoritmo de busqueda con articulos espanoles |

### Componentes UI
| Spec | Descripcion |
|------|-------------|
| [Layout](./components/layout.md) | Layout.astro + index.astro (shell HTML) |
| [FuelApp](./components/fuel-app.md) | Componente principal: estado global, efectos, persistencia |
| [FilterForm](./components/filter-form.md) | Sidebar: busqueda, filtros, ordenacion, marcas |
| [StationCard](./components/station-card.md) | Tarjeta de estacion: precios, tendencias, historial |
| [PriceChart](./components/price-chart.md) | Grafico de evolucion de precios (Recharts) |

### Flujos
| Spec | Descripcion |
|------|-------------|
| [Search Flow](./flows/search-flow.md) | Input -> debounce -> API -> render |
| [Favorites Flow](./flows/favorites-flow.md) | Pin/unpin, localStorage, carga fresca |
| [Data Sync Flow](./flows/data-sync-flow.md) | Cron -> Ministry API -> Supabase |

---

## Guia de Regeneracion

### Requisitos

- [Claude Code](https://claude.com/claude-code) CLI instalado
- Acceso al repositorio

### Regenerar un modulo

Abre Claude Code en la raiz del proyecto y usa estos comandos:

```
regenerate StationCard        # Reescribe src/components/StationCard.tsx
regenerate search API         # Reescribe src/pages/api/search.ts
regenerate fuel service       # Reescribe src/lib/fuel.ts
regenerate PriceChart         # Reescribe src/components/PriceChart.tsx
```

Claude leera la spec correspondiente y generara el codigo siguiendo los tipos, queries, clases Tailwind y logica documentados.

### Regenerar todo el proyecto

```
regenerate all
```

Esto regenera todos los archivos fuente en orden de dependencias:

| Paso | Archivo generado | Spec(s) usada(s) |
|------|-----------------|-------------------|
| 1 | `src/lib/supabase.ts` | `services/supabase-client.md` |
| 2 | `src/styles/global.css` | `04-styles.md` |
| 3 | `src/lib/fuel.ts` | `services/fuel-service.md` + `services/search-conditions.md` |
| 4 | `src/pages/api/search.ts` | `api/search.md` |
| 5 | `src/pages/api/history.ts` | `api/history.md` |
| 6 | `src/pages/api/stats.ts` | `api/stats.md` |
| 7 | `src/pages/api/suggestions.ts` | `api/suggestions.md` |
| 8 | `src/pages/api/update-prices.ts` | `api/update-prices.md` |
| 9 | `src/components/PriceChart.tsx` | `components/price-chart.md` |
| 10 | `src/components/StationCard.tsx` | `components/station-card.md` |
| 11 | `src/components/FuelApp.tsx` | `components/fuel-app.md` + `components/filter-form.md` |
| 12 | `src/layouts/Layout.astro` | `components/layout.md` |
| 13 | `src/pages/index.astro` | `components/layout.md` |

El orden importa: servicios antes que APIs, APIs antes que componentes.

### Mantener specs sincronizadas

Despues de cambiar codigo manualmente:

```
update spec StationCard       # Actualiza la spec para reflejar el codigo actual
```

Para verificar si hay desviaciones entre codigo y spec:

```
diff spec StationCard         # Compara y reporta diferencias
```

---

## Flujo de trabajo para nuevas features

```
1. Editar la spec del modulo afectado (o crear una nueva)
2. Ejecutar "regenerate [modulo]"
3. Probar con "npm run dev" en frontend_astro/
4. Commit de spec + codigo generado
```

Ejemplo - agregar un nuevo endpoint:

1. Crear `specs/api/mi-nuevo-endpoint.md` con la estructura estandar (ruta, params, logica, respuesta)
2. Actualizar `specs/README.md` con el nuevo link
3. Actualizar `CLAUDE.md` con la nueva entrada en la tabla de regeneracion
4. `regenerate mi-nuevo-endpoint`

---

## Estructura de cada spec

Todas las specs siguen una estructura consistente segun su tipo:

### Specs de API
- Ruta y metodo HTTP
- Tabla de parametros (nombre, tipo, default, descripcion)
- Logica paso a paso
- Ejemplo de respuesta JSON con tipos
- Codigos de error
- Dependencias

### Specs de Servicios
- Funciones exportadas (signature TypeScript)
- Funciones internas
- Algoritmos en pseudocodigo
- Queries Supabase (tabla, campos, filtros, orden)
- Edge cases

### Specs de Componentes
- Interface de Props (TypeScript)
- Estado interno (hooks, tipos, defaults)
- Efectos (trigger, dependencias, logica)
- Arbol de renderizado (estructura JSX con clases Tailwind)
- Interacciones (eventos, callbacks)
- Responsive (mobile vs desktop)

### Specs de Flujos
- Diagrama de secuencia ASCII
- Pasos detallados del flujo end-to-end
- Estado que cambia en cada paso
- Persistencia (localStorage)

---

## Desarrollo local

```bash
cd frontend_astro
npm install
npm run dev          # http://localhost:4321
```

Para build de produccion:

```bash
npm run build        # output en dist/
npm run preview      # preview local del build
```
