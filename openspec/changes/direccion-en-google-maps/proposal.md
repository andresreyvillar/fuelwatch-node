# Proposal — direccion-en-google-maps

> **Slice:** `direccion-en-google-maps` (estaciones)
> **Nivel:** `small` <!-- una capability, solo UI + módulo puro, sin dependencias ni API -->

## Por qué

Petición del humano: al pulsar la dirección de una estación, abrir su ubicación en Google Maps (pestaña nueva en el
navegador, app en el iPhone). Hoy la dirección es texto sin acción.

## Qué cambia

- `frontend_astro/src/lib/maps.ts` (nuevo, puro) — `googleMapsUrl(station)`: coordenadas si están en España; si no,
  dirección + localidad + provincia.
- `frontend_astro/src/lib/route.ts` — `SPAIN_BOUNDS` e `isInSpain()` pasan aquí desde `route-stations.ts` para
  reutilizarlos (sin cambio de comportamiento del endpoint).
- `frontend_astro/src/pages/api/route-stations.ts` — usa `isInSpain()`.
- `frontend_astro/src/components/StationCard.tsx` — la dirección es un `<a href target="_blank" rel="noopener
  noreferrer">` con `aria-label`.
- `specs/components/station-card.md`, `specs/services/route.md`.

## Fuera de alcance

- Apple Maps u otras apps; navegación paso a paso; corrección de coordenadas del Ministerio.

## Impacto

Todas las tarjetas (búsqueda, favoritos, ruta). Sin cambios de API.

## Riesgos y seguridad

Enlace a un dominio externo fijo con `rel="noopener noreferrer"`; la dirección se codifica con
`encodeURIComponent`. El gate `security` aplica.
