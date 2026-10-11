# Recibo — estadistica-zona-4-carburantes

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/lib/fuel.ts` — `getStats()` resume los cuatro carburantes (`diesel`, `diesel_extra`, `gas95`, `gas98`) con precios > 0, omite los que no tienen ninguno y devuelve `null` si no queda ninguno.
- `frontend_astro/tests/estadistica-zona-4-carburantes/stats.test.ts` — fuera los `test.fails`: los cuatro escenarios son tests normales.
- `specs/api/stats.md` — respuesta con cuatro claves, omisión y `null`.
- `specs/services/fuel-service.md` — lógica de `getStats()` con `buildStats`/`summarizePrices`.
- `specs/02-data-model.md` — tipo `Stats` parcial con los cuatro carburantes.

## Comprobado

- Semáforo: rojo real 4/4 → verde 4/4; regresión 2/2; `tsc --noEmit` limpio.
- Zombis 4/4: cada uno hace caer exactamente sus tests.
- `./vsk/bin/vsk gates verify --change estadistica-zona-4-carburantes` → traceability, adversarial (2 verificadores, sin refutación), security y docs en verde.

## Pendiente

- Hallazgos preexistentes de seguridad (baja): comas sin escapar en `getSearchConditions()` y `error.message` expuesto en el 500 · slice aparte, decide el humano.
- Riesgo preexistente: la consulta no pagina (límite de 1000 filas de PostgREST con prefijos de CP amplios) · slice aparte, decide el humano.
- Trabajo en `main` en lugar de `feat/{change}`, por autorización explícita del humano.
