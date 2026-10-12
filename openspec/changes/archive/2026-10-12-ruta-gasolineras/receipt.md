# Recibo — ruta-gasolineras

**Veredicto:** LISTO PARA COMMIT (migración de coordenadas ejecutada el 2026-10-12: 12.465/12.465 convertidas)

## Qué cambió

- `frontend_astro/src/lib/route.ts` — geometría del corredor: polyline6, tramos, cajas, proyección por tramo, más barata por tramo.
- `frontend_astro/src/lib/fuel.ts` — `findStationsAlongRoute()`: OSRM con timeout, 404 si no hay ruta, enganche > 5 km, ferry o > 1.600 km.
- `frontend_astro/src/pages/api/route-stations.ts` — validación (caja de España, radio exacto), 400/404/502 y caché de 1 h.
- `frontend_astro/src/components/RouteFinder.tsx` — pestaña Ruta: formulario, avisos y lista por km.
- `frontend_astro/src/components/PlaceInput.tsx` — autocompletado Photon limitado a España.
- `frontend_astro/src/components/RouteMap.tsx` — mapa Leaflet con carga diferida.
- `frontend_astro/src/components/FuelApp.tsx` — pestañas Buscar / Ruta.
- `frontend_astro/src/styles/global.css` — colores del mapa.
- `frontend_astro/package.json` — leaflet, react-leaflet, @types/leaflet (versión fija).
- `frontend_astro/package-lock.json` — lo mismo.
- `frontend_astro/tests/ruta-gasolineras/route-stations.test.ts` — 11 tests de escenario.
- `openspec/slices/ruta/ruta-gasolineras.md` — escenarios precisados y limitaciones.
- `specs/api/route-stations.md` — endpoint nuevo.
- `specs/services/route.md` — servicio nuevo.
- `specs/components/route-finder.md` — componente nuevo.
- `specs/components/fuel-app.md` — pestañas.
- `specs/01-architecture.md` — endpoint y componentes.
- `specs/04-styles.md` — colores del mapa.
- `specs/README.md` — índice.
- `vsk/PROJECT.md` — regla de contratos externos.
- `vsk/lessons.yaml` — lección `contrato-externo-probado-contra-el-servicio-real`.
- `docs/lecciones.md` — su narración.

## Comprobado

- Semáforo 7/7; suite 44/44; `tsc` y build limpios; zombis 11/11.
- Gates verify en verde tras dos rondas: refutaciones corregidas y re-verificadas.
- Datos reales en local: Vigo → Madrid, 209 estaciones a 2 km.

## Pendiente

- Probar la pestaña Ruta en el navegador · humano. Borrar `backup.servicestations_coords_bak` cuando se quiera · humano.
- Vigilar la CPU en Cloudflare (1-23 ms medidos; el plan gratuito permite 10 ms) · tras desplegar.
- Riesgos bajos aceptados: caja rectangular, sin límite de peticiones a OSRM, 1.000 filas por tramo, `error.message` en el 500.
