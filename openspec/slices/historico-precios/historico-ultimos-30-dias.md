---
slice: historico-ultimos-30-dias
status: proposed
kind: action
actor: conductor
trigger:
  type: http
  surface: api
  detail: "GET /api/history?id={ideess}"
events:
  emits: []
  consumes: []
specs:
  - historico-precios
tests_root: frontend_astro/tests/historico-ultimos-30-dias
blocked: null
---

# El histórico de una estación muestra los últimos 30 días

**Actor:** conductor (a través de la app, al abrir el gráfico de una estación)
**Trigger:** `GET /api/history?id={ideess}`

## Contexto

El gráfico de cada estación (glosario: `historico-de-precios`) dibuja la serie de precios diarios que
devuelve `/api/history`, y la app le añade al final el precio actual.

Hoy `getStationHistory()` (`frontend_astro/src/lib/fuel.ts:93`) ordena `price_history` por fecha
ascendente y corta en 30 filas: devuelve los 30 días **más antiguos**. Dato medido en Supabase
(2026-10-11): la estación 362 tiene 223 días desde el 2026-02-04, así que el gráfico pinta del 4 de
febrero al 5 de marzo y luego salta al precio de hoy.

Ventana elegida por el humano: los últimos 30 días naturales, incluido hoy (fecha ≥ hoy − 29 días), en
fecha UTC como el resto de la app. Si la sincronización falló algún día, ese día no aparece: no se rellena
con días más antiguos.

Job story: `consultar-historico`.

## Comportamiento observable

Cada elemento de la respuesta es `{ fecha, diesel, gas95, diesel_extra, gas98 }`, ordenados por `fecha`
ascendente.

### historico-ultimos-30-dias
**WHEN** se pide el histórico de una estación con precios diarios de más de 30 días
**THEN** responde 200 con los precios diarios de los últimos 30 días (desde hoy − 29 hasta hoy), ordenados de más antiguo a más reciente

### historico-con-huecos-no-se-rellena
**WHEN** dentro de los últimos 30 días faltan algunos días y la estación tiene precios más antiguos
**THEN** responde solo con los días de la ventana que existen, sin incluir ningún día anterior a hoy − 29

### historico-sin-datos-recientes
**WHEN** la estación solo tiene precios diarios anteriores a hoy − 29
**THEN** responde 200 con una lista vacía

## Estado después

Nada cambia en los datos: es una lectura. El gráfico enseña el último mes y enlaza con el precio actual.

## Edge cases

- Comportamiento que se conserva (regresión, sin `@scenarios`): estación con menos de 30 días de histórico,
  todos recientes → todos sus días; sin `id` → 400 `{ "error": "Missing id" }`; error de Supabase → 500
  `{ "error": "<mensaje>" }`.
- Con la lista vacía, el gráfico ya muestra «No hay datos históricos suficientes aún» (`PriceChart.tsx:11`).

## Fuera de alcance

- Elegir el periodo desde la interfaz (7/30/90 días): no lo ha pedido el humano.
- Fecha local de España en vez de UTC: la app entera usa UTC (`PriceChart.tsx:16`); cambiarlo es otro slice.
- Validar `id` no numérico (`parseInt` da `NaN`): comportamiento previo, no lo toca este slice.
- La tendencia (`attachTrends`, ventana de 3 días): es otro término y otro cálculo.
