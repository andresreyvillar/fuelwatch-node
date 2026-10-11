---
slice: estadistica-zona-4-carburantes
status: shipped
kind: action
actor: conductor
trigger:
  type: http
  surface: api
  detail: "GET /api/stats?location={localidad}"
events:
  emits: []
  consumes: []
specs:
  - estadistica-zona
tests_root: frontend_astro/tests/estadistica-zona-4-carburantes
blocked: null
---

# La estadística de zona cubre los cuatro carburantes

**Actor:** conductor (a través de la app, que pide la estadística al buscar una localidad)
**Trigger:** `GET /api/stats?location={localidad}`

## Contexto

La estadística de zona (glosario: `estadistica-de-zona`) da el precio mínimo, máximo y medio de cada
carburante en las estaciones de la localidad buscada. La tarjeta de cada estación la usa para situar su
precio en una barra relativa.

Hoy `getStats()` (`frontend_astro/src/lib/fuel.ts:123`) consulta los cuatro precios pero solo devuelve
`diesel` y `gas95`. `StationCard.tsx:23` y `:29` ya piden `stats.diesel_extra` y `stats.gas98`; como no
llegan, la barra de Gasóleo Premium y Gasolina 98 se queda siempre al 50 %.

Además, cuando un carburante no tiene ningún precio válido, `Math.min()` de un array vacío da `Infinity`,
que se serializa como `null`: la respuesta lleva `{ min: null, max: null, avg: 0 }`. Y si la localidad
tiene estaciones pero ningún precio válido, la API devuelve un objeto con esos valores en lugar de `null`.

Precio válido (glosario: `precio`): mayor que 0. Un 0 o un vacío significa «sin dato».

Job story: `comparar-precio-con-la-zona`. Escenarios funcionales: `estadistica-zona-cuatro-carburantes`
(feliz) y `estadistica-zona-sin-precios` (error).

## Comportamiento observable

Claves de carburante en la respuesta: `diesel` (Gasóleo A), `diesel_extra` (Gasóleo Premium), `gas95`
(Gasolina 95 E5) y `gas98` (Gasolina 98 E5). Cada una es `{ min, max, avg }` en euros por litro, con `avg`
como media aritmética de los precios válidos.

### cuatro-carburantes-con-precio
**WHEN** se pide la estadística de una localidad cuyas estaciones tienen precios válidos de los cuatro carburantes
**THEN** responde 200 con `diesel`, `diesel_extra`, `gas95` y `gas98`, cada uno con el mínimo, el máximo y la media de los precios de ese carburante en esas estaciones

### precios-sin-dato-se-ignoran
**WHEN** alguna estación de la localidad tiene precio 0 en un carburante que otras estaciones sí venden
**THEN** el mínimo, el máximo y la media de ese carburante se calculan solo con los precios mayores que 0

### carburante-sin-precios-se-omite
**WHEN** ninguna estación de la localidad tiene precio válido de un carburante, pero sí de otros
**THEN** la respuesta no incluye la clave de ese carburante e incluye las de los carburantes con precio

### localidad-sin-precios-validos
**WHEN** la localidad tiene estaciones pero ninguna tiene precio válido de ningún carburante
**THEN** responde 200 con `null`

## Estado después

Nada cambia en los datos: es una lectura. La app recibe estadística de los cuatro carburantes y la barra
relativa de Gasóleo Premium y Gasolina 98 deja de quedarse fija al 50 %.

## Edge cases

- Comportamiento que se conserva (ya se cumplía; cubierto por tests de regresión sin `@scenarios` en el
  mismo fichero): sin estaciones que coincidan → 200 con `null`; error de Supabase → 500 con
  `{ "error": "<mensaje>" }`.
- Una sola estación con precio: mínimo, máximo y media coinciden (la tarjeta ya lo trata como 50 %).
- La búsqueda de localidades (artículos al final, código postal) no cambia: sigue en `getSearchConditions()`.

## Fuera de alcance

- Rango de precio máximo del filtro (`FuelApp.tsx:257`), que solo usa diésel y 95: decisión del humano,
  queda para un slice propio.
- Redondeo de la media: hoy no se redondea y la tarjeta solo usa mínimo y máximo.
- Cambiar cómo se buscan las estaciones de la localidad: es otra job story (`buscar-estaciones-por-localidad`).
