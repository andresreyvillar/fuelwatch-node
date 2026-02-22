# 01 - Arquitectura

## Vision General

Fuel Watch es una aplicacion web que muestra precios de combustible en estaciones de servicio de Espana. Los datos se obtienen de la API publica del Ministerio de Consumo y se almacenan en Supabase. Los usuarios pueden buscar estaciones por localidad, filtrar por tipo de combustible y marca, marcar favoritos y ver la evolucion de precios.

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | Astro | 5.17.x |
| UI Library | React | 19.x |
| CSS | Tailwind CSS | 4.x (via @tailwindcss/vite) |
| Base de datos | Supabase (PostgreSQL) | - |
| Cliente DB | @supabase/supabase-js | 2.x |
| Iconos | lucide-react | 0.563.x |
| Graficos | Recharts | 3.x |
| Hosting | Cloudflare Pages | SSR mode |
| CI/CD | GitHub Actions | Cron horario |

## Modo de Renderizado

- **Output**: `server` (SSR en Cloudflare Pages)
- Los componentes React se hidratan con `client:load`
- Las API routes (`src/pages/api/`) se ejecutan en el edge (Cloudflare Workers)

## Estructura de Carpetas

```
fuel-watch/
├── specs/                          # <- Esta carpeta (especificaciones)
├── frontend_astro/                 # Proyecto Astro (codebase activo)
│   ├── src/
│   │   ├── components/
│   │   │   ├── FuelApp.tsx         # Componente principal + FilterForm (inline)
│   │   │   ├── StationCard.tsx     # Tarjeta de estacion
│   │   │   └── PriceChart.tsx      # Grafico de precios
│   │   ├── layouts/
│   │   │   └── Layout.astro        # Shell HTML
│   │   ├── lib/
│   │   │   ├── fuel.ts             # Logica de negocio
│   │   │   └── supabase.ts         # Cliente Supabase
│   │   ├── pages/
│   │   │   ├── index.astro         # Pagina principal
│   │   │   └── api/
│   │   │       ├── search.ts       # Busqueda de estaciones
│   │   │       ├── history.ts      # Historial de precios
│   │   │       ├── stats.ts        # Estadisticas
│   │   │       ├── suggestions.ts  # Autocompletado
│   │   │       └── update-prices.ts # Sync con Ministerio
│   │   └── styles/
│   │       └── global.css          # Tailwind + tema custom
│   ├── public/
│   │   ├── favicon.svg
│   │   └── favicon.ico
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── wrangler.toml               # Cloudflare Pages config
│   └── wrangler.jsonc              # Cloudflare Workers config
├── carburantes.sql                 # Schema SQL de Supabase
└── docker-compose.yml              # Desarrollo local
```

## Flujo de Datos General

```
Ministry API (gobierno)
    │ (cada hora via GitHub Actions)
    ▼
GET /api/update-prices
    │
    ▼
Supabase
├── servicestations (datos actuales)
└── price_history (historico diario)
    │
    ▼
API Routes (edge)
├── /api/search      → busqueda + tendencias
├── /api/stats       → min/max/avg
├── /api/suggestions → autocompletado
└── /api/history     → ultimos 30 dias
    │
    ▼
React Components (cliente)
├── FuelApp (estado global)
├── StationCard (tarjeta)
└── PriceChart (grafico)
```

## Pagina Unica (SPA-like)

La aplicacion tiene una sola pagina (`index.astro`) que monta `FuelApp` como componente React hidratado. Toda la navegacion y estado se maneja del lado del cliente con React hooks.
