# Recibo — ruta-orden-y-distancia

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/lib/route-list.ts` — `sortRouteStations()` (km o precio, desempate por km) y `routePositionLabel()`.
- `frontend_astro/src/components/RouteStationList.tsx` — lista de la ruta con selector «Ordenar» y etiqueta de distancia.
- `frontend_astro/src/components/RouteFinder.tsx` — usa la lista; guarda carburante y radio de la petición.
- `frontend_astro/tests/ruta-orden-y-distancia/route-list.test.ts` — empate en orden inverso.
- `specs/components/route-finder.md` — selector y etiqueta.

## Comprobado

- Semáforo 2/2; suite 46/46; `tsc` y build limpios; zombis 2/2 (test reforzado para el desempate).
- Verificación adversarial con 212 estaciones reales de producción: sin refutación. Seguridad: sin hallazgos.

## Pendiente

- Probar el selector en el navegador · humano.
- Mejora propuesta al kit: gate `red` por escenarios del delta · humano (repositorio del kit).
