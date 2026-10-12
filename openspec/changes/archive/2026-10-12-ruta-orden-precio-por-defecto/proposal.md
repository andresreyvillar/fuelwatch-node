# Proposal — ruta-orden-precio-por-defecto

> **Slice:** N/A (cambia el valor por defecto del selector del slice `ruta-orden-y-distancia`; sin escenario nuevo)
> **Nivel:** `trivial`

## Por qué

Petición del humano tras probar la pestaña Ruta: «por defecto el selector esté en ordenar por precio». Hoy la lista
empieza «Por km de ruta».

## Qué cambia

- `frontend_astro/src/components/RouteStationList.tsx` — el selector empieza en «Por precio» y es la primera opción.
- `specs/components/route-finder.md` y el requisito «Orden de la lista de la ruta» (delta MODIFIED): por defecto,
  precio.

## Fuera de alcance

- Recordar la elección entre rutas: no pedido.

## Riesgos y seguridad

Ninguno: cambia el estado inicial de un selector en el navegador.
