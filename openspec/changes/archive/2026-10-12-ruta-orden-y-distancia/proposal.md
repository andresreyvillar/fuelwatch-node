# Proposal — ruta-orden-y-distancia

> **Slice:** `ruta-orden-y-distancia` (ruta) — slice nuevo sobre la pestaña Ruta de `ruta-gasolineras`
> **Nivel:** `small` <!-- solo interfaz de la pestaña Ruta y un módulo puro; sin cambios de API ni dependencias -->

## Por qué

Petición del humano tras usar la pestaña Ruta: «en la opción de ruta debe permitir ordenar por precio; además
poner qué distancia hay desde origen». Hoy la lista solo va por km de ruta y la etiqueta «km 95 · a 0.8 km de la
ruta» no deja claro que 95 son los km por carretera desde el origen.

## Qué cambia

- `frontend_astro/src/lib/route-list.ts` (nuevo, sin Supabase) — `sortRouteStations()` (por km de ruta o por precio
  del carburante elegido) y `routePositionLabel()` («A 95 km del origen · a 0,8 km de la carretera»).
- `frontend_astro/src/components/RouteFinder.tsx` — selector «Ordenar» (Por km de ruta / Por precio) sobre la lista y
  la nueva etiqueta de distancia.
- `specs/components/route-finder.md` — selector y etiqueta.

## Fuera de alcance

- Ordenar en el servidor: la ruta ya llega completa; ordenar en el navegador basta.
- Cambiar el mapa (los marcadores no dependen del orden) o la marca «Más barata del tramo».
- Distancia en línea recta desde el origen: la que se muestra es la de la ruta por carretera (`kmRuta`).

## Impacto

Solo la pestaña Ruta. `/api/route-stations` no cambia.

## Riesgos y seguridad

Ninguno nuevo: ordena y formatea datos que ya llegan al navegador. El gate `security` aplica igualmente.
