---
slice: ruta-orden-y-distancia
status: shipped
kind: action
actor: conductor
trigger:
  type: ui
  surface: web
  detail: "pestaña Ruta: selector «Ordenar» y etiqueta de cada gasolinera de la lista"
events:
  emits: []
  consumes: []
specs:
  - ruta
tests_root: frontend_astro/tests/ruta-orden-y-distancia
blocked: null
---

# El conductor ordena las gasolineras de su ruta por precio y ve a qué distancia del origen está cada una

**Actor:** conductor
**Trigger:** en la pestaña «Ruta», con una ruta calculada (slice `ruta-gasolineras`), elige el orden de la lista y
lee la etiqueta de cada gasolinera.

## Contexto

Petición del humano tras usar la pestaña Ruta: «en la opción de ruta debe permitir ordenar por precio; además poner
qué distancia hay desde origen». Hoy la lista solo va por km de ruta y la etiqueta «km 95 · a 0.8 km de la ruta» no
deja claro que 95 son los km por carretera desde el origen (`kmRuta` de `/api/route-stations`).

Se ordena en el navegador: la respuesta de `/api/route-stations` ya trae todas las gasolineras del corredor.

Job story: `planificar-repostaje-en-ruta`.

## Comportamiento observable

### ruta-ordenada-por-precio
**WHEN** el conductor elige ordenar la lista de la ruta por precio
**THEN** las gasolineras van del precio más bajo al más alto del carburante elegido y, a igual precio, por km de ruta; al volver a «Por km de ruta» recuperan el orden del viaje

### ruta-distancia-desde-origen
**WHEN** se muestra una gasolinera de la ruta
**THEN** su etiqueta dice «A {km de ruta redondeado} km del origen · a {desvío con un decimal y coma} km de la carretera»

## Estado después

Nada cambia en los datos. El orden elegido no se guarda (vuelve a «Por km de ruta» al calcular otra ruta).

## Edge cases

- La marca «Más barata del tramo» y el mapa no cambian con el orden.
- El selector no tiene test automático (no hay jsdom ni Playwright): se comprueba a mano; la lógica de orden y la
  etiqueta sí, en `src/lib/route-list.ts`.

## Fuera de alcance

- Ordenar en el servidor: no hace falta.
- Distancia en línea recta desde el origen: se muestra la de la ruta por carretera.
- Guardar el orden elegido entre rutas.
