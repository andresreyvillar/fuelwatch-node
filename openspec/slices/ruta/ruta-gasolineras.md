---
slice: ruta-gasolineras
status: proposed
kind: action
actor: conductor
trigger:
  type: ui
  surface: web
  detail: "pestaña Ruta: origen, destino y desvío máximo → GET /api/route-stations"
events:
  emits: []
  consumes: []
specs:
  - ruta
tests_root: frontend_astro/tests/ruta-gasolineras
blocked: "migración supabase/coordenadas-numericas.sql pendiente (la ejecuta el humano)"
---

# El conductor ve las gasolineras que quedan cerca de su ruta, en el orden en que se las encuentra

**Actor:** conductor
**Trigger:** en la pestaña «Ruta» elige origen y destino (autocompletado de Photon), un desvío máximo
(1, 2, 5 o 10 km) y pulsa «Calcular». La app llama a
`GET /api/route-stations?from={lon},{lat}&to={lon},{lat}&radius={km}&fuel={diesel|gas95}`.

## Contexto

Diseño completo en `openspec/changes/ruta-gasolineras/design.md`. Hoy la app solo busca por localidad o
provincia; para un viaje hay que ir buscando población a población. Con las coordenadas numéricas
(`coordenadas-numericas`) ya se puede filtrar por zona en la base de datos.

Decisiones del humano: OpenStreetMap sin claves (Leaflet, Photon, OSRM); desvío seleccionable 1/2/5/10 km
(por defecto 2) medido en línea recta a la ruta; lista por km de ruta marcando la más barata de cada tramo de
100 km; nueva pestaña «Ruta» junto a la búsqueda actual. El carburante es el de orden de la búsqueda por
provincia (Diésel → Gasóleo A; solo Gasolina → Gasolina 95).

Job story: `buscar-donde-repostar` (épica); nueva job story `planificar-repostaje-en-ruta`.

## Comportamiento observable

Respuesta 200: `{ route: { distanceKm, durationMin, geometry: [[lon, lat], …] },
stations: [{ …estación, kmRuta, desvioKm, masBarataDelTramo }] }`.

### ruta-gasolineras-en-el-corredor
**WHEN** se pide la ruta entre dos puntos con un desvío máximo
**THEN** la respuesta incluye las estaciones a esa distancia o menos de la ruta, con su `desvioKm`, y ninguna más lejana

### ruta-ordenada-por-km
**WHEN** hay varias estaciones en el corredor
**THEN** salen ordenadas por el km de la ruta en el que quedan (`kmRuta`), desde el origen

### ruta-mas-barata-por-tramo
**WHEN** el corredor tiene estaciones en distintos tramos de 100 km de la ruta
**THEN** en cada tramo la estación con el precio más bajo del carburante elegido lleva `masBarataDelTramo: true` y las demás `false`

### ruta-sin-precio-excluida
**WHEN** una estación del corredor no tiene precio del carburante elegido (precio 0)
**THEN** no aparece en la respuesta

### ruta-parametros-no-validos
**WHEN** falta el origen o el destino, no son coordenadas, el desvío no es 1, 2, 5 o 10, o el carburante no es `diesel` ni `gas95`
**THEN** responde 400 con `{ "error": "Invalid <parámetro>" }` (`from`, `to`, `radius` o `fuel`)

### ruta-sin-ruta
**WHEN** el servicio de rutas no encuentra ruta por carretera entre los dos puntos
**THEN** responde 404 con `{ "error": "No route" }`

### ruta-servicio-no-disponible
**WHEN** el servicio de rutas no responde o responde con error
**THEN** responde 502 con `{ "error": "Routing unavailable" }`

## Estado después

Nada cambia en los datos: son lecturas. La app tiene una pestaña «Ruta» con mapa y lista.

## Edge cases

- Una estación cerca de dos puntos de la ruta (la ruta pasa dos veces cerca) aparece una vez, en el km más
  cercano a la ruta.
- Estaciones con coordenadas nulas o erróneas (`0,0`, invertidas) no caen en ninguna caja: no aparecen.
- La interfaz (pestaña, autocompletado, mapa, selector y lista) no tiene test automático: no hay jsdom ni
  Playwright. Se comprueba a mano con `npm run dev` antes de cerrar.

## Fuera de alcance

- Desvío real por carretera hasta cada estación, paradas intermedias, guardar rutas, evitar peajes.
- Autonomía del vehículo («avísame antes de quedarme sin depósito»).
- Cambiar OSRM público por otro proveedor: slice aparte si la demo no basta.
- Corregir coordenadas erróneas del Ministerio.
