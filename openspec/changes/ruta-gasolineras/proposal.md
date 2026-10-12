# Proposal — ruta-gasolineras

> **Slice:** `ruta-gasolineras` (ruta)
> **Nivel:** `large` <!-- dependencias nuevas, servicios externos, endpoint y pestaña nuevos; diseño en design.md -->

## Por qué

El humano quiere fijar una ruta y ver las gasolineras a menos de X km de la carretera para decidir dónde parar
a repostar. Hoy hay que buscar población a población. Diseño, alternativas descartadas y riesgos en
`design.md`.

## Qué cambia

- `frontend_astro/src/lib/route.ts` (nuevo) — geometría pura: distancias, tramos y cajas por tramo, distancia de
  un punto a la ruta y km de ruta, simplificación de la línea, la más barata por tramo.
- `frontend_astro/src/lib/fuel.ts` — `findStationsAlongRoute()`: OSRM, consultas por caja a Supabase y armado
  de la respuesta.
- `frontend_astro/src/pages/api/route-stations.ts` (nuevo) — validación de parámetros y códigos 400/404/502.
- `frontend_astro/src/components/RouteFinder.tsx` y `RouteMap.tsx` (nuevos) — pestaña «Ruta»: autocompletado
  Photon, selector de desvío, mapa Leaflet y lista por km de ruta.
- `frontend_astro/src/components/FuelApp.tsx` — pestañas «Buscar» / «Ruta» (la búsqueda actual no cambia).
- `frontend_astro/package.json` — `leaflet` 1.9.4, `react-leaflet` 5.0.0, `@types/leaflet` 1.9.22 (**con
  permiso del humano**).
- Specs nuevas `specs/api/route-stations.md`, `specs/services/route.md`, `specs/components/route-finder.md`;
  `specs/components/fuel-app.md` y `specs/01-architecture.md`.
- `vsk/architecture.yaml` — componentes Ruta, OSRM y Photon.

## Fuera de alcance

Ver el slice: desvío real por carretera, paradas, rutas guardadas, peajes, autonomía, otro proveedor de rutas,
corrección de coordenadas del Ministerio.

## Impacto

Nueva pestaña y nuevo endpoint; la búsqueda por localidad/provincia no cambia. Bloqueado para desplegar hasta
que el humano ejecute la migración `supabase/coordenadas-numericas.sql`.

## Riesgos y seguridad

- Entradas externas nuevas (`from`, `to`, `radius`, `fuel`): se validan antes de usarse; `fuel` contra lista
  cerrada; las coordenadas se convierten a número y se comprueban rangos antes de construir la URL de OSRM.
- Llamadas salientes del servidor a OSRM (SSRF): URL fija, solo se interpolan números validados.
- Coste por petición acotado: 1 llamada a OSRM y ≤ 30 consultas a Supabase.
- Dependencias nuevas de terceros (Leaflet): versión fija y revisión de `npm audit`.
- El gate `security` aplica.
