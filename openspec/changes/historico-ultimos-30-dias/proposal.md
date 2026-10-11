# Proposal — historico-ultimos-30-dias

> **Slice:** `historico-ultimos-30-dias` (historico-precios)
> **Nivel:** `small` <!-- una capability, mismo contrato de respuesta, sin dependencias ni rutas sensibles -->

## Por qué

`getStationHistory()` (`frontend_astro/src/lib/fuel.ts:93`) ordena ascendente y aplica `limit(30)`: devuelve
los 30 días más antiguos de `price_history`. Medido en Supabase el 2026-10-11: la estación 362 tiene 223
días desde el 2026-02-04, de modo que el gráfico enseña febrero-marzo y salta al precio de hoy. El humano
pide limitar el gráfico a los últimos 30 días (ventana de calendario).

## Qué cambia

- `frontend_astro/src/lib/fuel.ts` — `getStationHistory()` filtra `fecha >= hoy − 29` (UTC) y deja de
  cortar por número de filas.
- `frontend_astro/tests/historico-ultimos-30-dias/history.test.ts` — tests del slice y de regresión.
- `specs/api/history.md` y `specs/services/fuel-service.md` — describen la ventana de 30 días.

## Fuera de alcance

- Periodo elegible en la interfaz: no pedido.
- Fecha local de España: la app usa UTC en `PriceChart.tsx:16`; cambiarlo afecta a más slices.
- Validación de `id` no numérico: comportamiento previo de `history.ts`, sin relación con la ventana.
- Tendencia de 3 días (`attachTrends`): otro cálculo.

## Impacto

El gráfico de cada estación pasa a enseñar el último mes. Sin cambios en la forma de la respuesta ni en
`PriceChart.tsx`; una estación sin datos recientes ve el mensaje de «sin datos históricos» que ya existe.

## Riesgos y seguridad

Lectura pública como la actual; `id` sigue llegando como número a `.eq()`. Sin auth, secretos, datos
personales ni dependencias nuevas. El gate `security` aplica siempre en este proyecto.
