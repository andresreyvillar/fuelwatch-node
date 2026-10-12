# Proposal — busqueda-por-provincia

> **Slice:** `busqueda-por-provincia` (sugerencias, busqueda-provincia, estadistica-zona)
> **Nivel:** `standard` <!-- tres capabilities y cambio de contrato de /api/suggestions, sin dependencias ni migraciones -->

## Por qué

El humano quiere buscar y ordenar por precio las estaciones de toda una provincia. Hoy solo hay búsqueda por
localidad o CP, y el orden por precio se hace en el navegador sobre las páginas cargadas (50) de una consulta
ordenada por CP. MADRID tiene 914 estaciones (Supabase, 2026-10-11): sin orden en el servidor, «la más
barata» no es la más barata de la provincia.

## Qué cambia

- `frontend_astro/src/lib/fuel.ts` — `searchStationsByProvince()` (filtro `provincia`, precio > 0, orden por
  precio e id, paginación con total), `getProvinceStats()` (reutiliza `buildStats`) y `getSuggestions()`
  (localidades como hoy + provincias de la lista fija).
- `frontend_astro/src/lib/provinces.ts` (nuevo) — las 52 provincias del Ministerio y la coincidencia sin
  tildes ni posición del artículo; `provinceSortFuel()` (filtros activos → carburante de orden).
- `frontend_astro/src/pages/api/search.ts` — `?province=&fuel=`, 400 si `fuel` no es válido.
- `frontend_astro/src/pages/api/stats.ts` — `?province=`.
- `frontend_astro/src/pages/api/suggestions.ts` — delega en `getSuggestions()` y devuelve `{ tipo, nombre }`.
  Deja de importar `lib/supabase` directamente: se retira su entrada de `vsk/debt.txt`.
- `frontend_astro/src/components/FuelApp.tsx` — sugerencias con tipo, búsqueda y estadística por provincia,
  orden en el navegador coherente con el del servidor, última búsqueda guardada con su tipo.
- `specs/api/search.md`, `specs/api/stats.md`, `specs/api/suggestions.md`, `specs/services/fuel-service.md`,
  `specs/components/fuel-app.md` y `specs/components/filter-form.md` según lo anterior.
- `vsk/ontology.yaml` — término `provincia` y escenarios funcionales de `buscar-estaciones-por-localidad`.

## Fuera de alcance

- Órdenes por marca, CP o descendente en el servidor: no pedidos; siguen en el navegador como hoy.
- Orden por el más barato de los dos carburantes: exige vista o migración; el humano eligió Gasóleo A.
- Rango del filtro de precio con los cuatro carburantes: slice aparte ya anotado.
- Escape de comas en `getSearchConditions()`: hallazgo previo, slice de seguridad aparte. Este slice no usa
  `.or()` con texto del usuario para provincias (`.eq()` y la lista fija).

## Impacto

Nuevo modo de búsqueda en la app. `/api/suggestions` cambia de `string[]` a `{ tipo, nombre }[]`: su único
consumidor es `FuelApp.tsx`, que se actualiza en el mismo cambio. `/api/search?target=` y
`/api/stats?location=` no cambian.

## Riesgos y seguridad

Entradas externas nuevas: `province` y `fuel`. `fuel` se valida contra una lista cerrada antes de convertirse
en nombre de columna; `province` va por `.eq()`. Lecturas públicas con la clave anon, como hoy. El gate
`security` aplica (siempre en este proyecto). La interfaz se comprueba a mano: no hay jsdom ni Playwright.
