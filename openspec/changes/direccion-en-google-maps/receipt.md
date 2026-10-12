# Recibo — direccion-en-google-maps

**Veredicto:** LISTO PARA COMMIT

## Qué cambió

- `frontend_astro/src/lib/maps.ts` — `googleMapsUrl()`: coordenadas si están en España; si no, dirección, localidad y provincia.
- `frontend_astro/src/lib/route.ts` — `SPAIN_BOUNDS` e `isInSpain()`, compartidos.
- `frontend_astro/src/pages/api/route-stations.ts` — usa `isInSpain()` (mismo comportamiento).
- `frontend_astro/src/components/StationCard.tsx` — la dirección es un enlace a Google Maps (pestaña nueva, `noopener noreferrer`).
- `frontend_astro/tests/direccion-en-google-maps/maps.test.ts` — escenarios sobre la URL.
- `frontend_astro/tests/direccion-en-google-maps/station-card-link.test.ts` — render del enlace (`target`, `rel`).
- `specs/components/station-card.md` — enlace.
- `specs/services/route.md` — caja de España.

## Comprobado

- Semáforo 2/2; suite 49/49; `tsc` y build limpios; zombis 3/3.
- Verificación adversarial con datos reales y documentación de Google Maps URLs: sin refutación. Seguridad: pasa.

## Pendiente

- Probar el enlace en el iPhone (app de Google Maps) · humano.
