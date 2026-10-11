# Proposal — estadistica-zona-4-carburantes

> **Slice:** `estadistica-zona-4-carburantes` (estadistica-zona)
> **Nivel:** `standard` <!-- cambia el contrato de /api/stats (claves nuevas y null sin precios válidos) -->

## Por qué

La estadística de zona solo cubre Gasóleo A y Gasolina 95, aunque `getStats()` ya consulta los cuatro
precios (`frontend_astro/src/lib/fuel.ts:126`). `StationCard.tsx:23` y `:29` piden `stats.diesel_extra` y
`stats.gas98`; al no llegar, la barra relativa de Premium y 98 queda siempre al 50 % (`getPricePercentage`,
`StationCard.tsx:36-37`). Además, un carburante sin precios válidos produce `{ min: null, max: null, avg: 0 }`
(`Math.min()` vacío = `Infinity`), y una localidad sin ningún precio válido devuelve un objeto en vez de `null`.

## Qué cambia

- `frontend_astro/src/lib/fuel.ts` — `getStats()` calcula los cuatro carburantes, omite los que no tienen
  precio válido y devuelve `null` si no queda ninguno.
- `frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts` — tests nuevos contra el handler
  `GET` de `src/pages/api/stats.ts`, con el cliente de Supabase sustituido.
- `specs/api/stats.md` — se actualiza la spec de regeneración para que no contradiga el nuevo contrato.
- `src/pages/api/stats.ts` no cambia.

## Fuera de alcance

- Rango de precio máximo del filtro (`FuelApp.tsx:257`): el humano lo deja para otro slice.
- Redondeo de la media: la tarjeta solo usa mínimo y máximo (`StationCard.tsx:38`), sin efecto visible.
- Búsqueda de localidades (`getSearchConditions`): pertenece a `buscar-estaciones-por-localidad`.
- `suggestions.ts` importando Supabase directamente: deuda ya anotada en `vsk/debt.txt`, otro endpoint.

## Impacto

El conductor ve la barra relativa correcta en Gasóleo Premium y Gasolina 98. `FuelApp` solo lee
`diesel.min/max` y `gas95.min/max` con `?.` y valores por defecto (`FuelApp.tsx:257-258`), así que omitir un
carburante o recibir `null` no rompe nada (`if (statsData)` ya contempla `null`). No hay otros slices.

## Riesgos y seguridad

Lectura pública sin autenticación, como hoy. La entrada externa es `location`, que sigue pasando por
`getSearchConditions()` sin cambios. No toca rutas sensibles, secretos, datos personales ni dependencias de
producción. El gate `security` aplica igualmente (configurado para todo cambio).

Dependencia de desarrollo: ninguna nueva (Vitest 3.2.7 ya está). Riesgo: que Vitest no resuelva el módulo
`astro` de tipos al importar el handler; solo se importa `type APIRoute`, que se elimina al transpilar.
