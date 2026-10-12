# Proposal — coordenadas-numericas

> **Slice:** `coordenadas-numericas` (sincronizacion-precios)
> **Nivel:** `standard` <!-- toca rutas sensibles (scripts/sync-prices.mjs, update-prices) y una migración SQL -->

## Por qué

Paso previo de la ruta con gasolineras (slice 3b): hay que filtrar estaciones por coordenadas y hoy
`latitud`/`longitud` son texto con coma decimal (`"38,984139"`, medido en Supabase el 2026-10-11), copiadas
sin parsear por las dos sincronizaciones. Con texto no hay filtro por rango ni índice útil.

## Qué cambia

- `scripts/sync-prices.mjs` — `parseCoordinate()` (coma → punto, `null` si vacío o no numérico) y
  `toStation()` exportados; la creación del cliente y la ejecución pasan a `main`, solo al lanzarse el script
  directamente, para poder testearlo sin credenciales.
- `frontend_astro/src/lib/fuel.ts` — `updateDataFromMinistry()` aplica el mismo `parseCoordinate()`.
- `supabase/coordenadas-numericas.sql` (nuevo) — `ALTER COLUMN ... TYPE double precision USING
  NULLIF(replace(...), '')::double precision` e índice `(latitud, longitud)`. **Lo ejecuta el humano** en el
  editor SQL de Supabase, después de desplegar el código.
- `frontend_astro/tests/support/fake-supabase.ts` — registra los `upsert` para poder comprobarlos.
- `specs/02-data-model.md`, `specs/api/update-prices.md`, `specs/flows/data-sync-flow.md` — coordenadas
  numéricas y plan de migración.

## Fuera de alcance

- Ruta, mapa y corredor: slice 3b.
- Host del Ministerio distinto en las dos rutas: divergencia previa, slice aparte.
- Módulo común para las dos sincronizaciones: refactor mayor no pedido.
- Políticas RLS: slice de seguridad.

## Impacto

Ningún consumidor lee hoy las coordenadas. Tras la migración, `/api/search` las devuelve como números. Orden
seguro: desplegar código (los números caben en la columna de texto) → migración → siguiente sincronización.

## Riesgos y seguridad

- Ruta sensible: la sincronización de producción. Tras la migración, un texto no numérico haría fallar el
  upsert de todo el lote; por eso los valores vacíos o inválidos van a `null` explícito.
- La migración reescribe dos columnas de ~12.500 filas: el SQL convierte con `NULLIF` y `replace` para no
  fallar con vacíos; se entrega con consultas de comprobación antes y después.
- Sin secretos nuevos. El gate `security` aplica.
