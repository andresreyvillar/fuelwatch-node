# Proposal — borrar-endpoints-debug

> **Slice:** N/A
> **Nivel:** `trivial` <!-- borra endpoints sin spec que la app no usa; ningún comportamiento especificado cambia -->

## Por qué

`/api/debug`, `/api/debug-ministry`, `/api/debug-upsert` y `/api/test` son sondas manuales sin spec que siguen
expuestas en producción. Nadie las llama (búsqueda en `src`, `.github`, `scripts` y `specs`: sin resultados).
`debug-upsert` escribe estaciones en Supabase con las coordenadas como texto y fallará cuando se migren a
`double precision` (slice `coordenadas-numericas`). Decisión del humano: borrarlas.

## Qué cambia

- Borrados: `frontend_astro/src/pages/api/{debug,debug-ministry,debug-upsert,test}.ts`.
- `vsk/debt.txt` — sale la deuda de `debug.ts`/`debug-upsert.ts`.
- `CLAUDE.md`, `vsk/architecture.yaml` y `vsk/PROJECT.md` — dejan de mencionar esos endpoints.
- `Suggestion` pasa de `lib/fuel.ts` a `lib/provinces.ts`: `FuelApp.tsx` importaba el tipo desde `lib/fuel.ts`,
  contra la regla de `PROJECT.md` (la UI no importa `lib/fuel.ts`). Sin cambio de comportamiento.

## Fuera de alcance

- Los scripts manuales `frontend_astro/{test-*,debug-*,list-tables}.ts` y `debug-ministry-api.js`: no se
  despliegan como endpoints; no los pide el humano.

## Impacto

Cuatro rutas menos en producción (responderán 404). Ningún spec ni test cambia.

## Riesgos y seguridad

Reduce superficie: desaparece una escritura pública en Supabase (`debug-upsert`) y respuestas con `stack`.
