---
slice: direccion-en-google-maps
status: shipped
kind: action
actor: conductor
trigger:
  type: ui
  surface: web
  detail: "pulsar la dirección de una estación en su tarjeta (búsqueda, favoritos y ruta)"
events:
  emits: []
  consumes: []
specs:
  - estaciones
tests_root: frontend_astro/tests/direccion-en-google-maps
blocked: null
---

# El conductor pulsa la dirección de una gasolinera y la abre en Google Maps

**Actor:** conductor
**Trigger:** pulsa la dirección (icono de chincheta + texto) de cualquier tarjeta de estación.

## Contexto

Petición del humano: «al pulsar en el span donde pone la dirección, abrir la ubicación en Google Maps, en una nueva
pestaña del navegador o en la app de iPhone en el móvil». Hoy la dirección es texto sin acción
(`StationCard.tsx:96`).

Se usa la URL universal de Google Maps (`https://www.google.com/maps/search/?api=1&query=...`): en escritorio abre
una pestaña; en iPhone/Android abre la app de Google Maps si está instalada (si no, el navegador). No necesita clave.

Desde `coordenadas-numericas`, `latitud` y `longitud` son números: se usan para situar el punto exacto. Datos
medidos (2026-10-12): 3 estaciones en `0,0` y 1 con coordenadas invertidas; para esas, y para las que no tengan
coordenadas, se busca por dirección.

Job story: `buscar-estaciones-por-localidad` (el conductor quiere llegar a la estación elegida).

## Comportamiento observable

### direccion-abre-google-maps
**WHEN** el conductor pulsa la dirección de una gasolinera con coordenadas dentro de España
**THEN** se abre Google Maps, en una pestaña nueva (en el móvil, la app si está instalada), centrado en la latitud y longitud de la estación

### direccion-sin-coordenadas-busca-por-direccion
**WHEN** la gasolinera no tiene coordenadas válidas (vacías, `0,0` o fuera de España)
**THEN** Google Maps busca su dirección, localidad y provincia

## Estado después

Nada cambia en los datos ni en la app: se abre Google Maps fuera de ella.

## Edge cases

- La tarjeta se usa en la búsqueda, en favoritos y en la ruta: el enlace funciona en las tres.
- El enlace no debe activar otras acciones de la tarjeta (favorito, historial).
- Abrir la pestaña o la app no tiene test automático (comportamiento del navegador/sistema): se comprueba a mano.

## Fuera de alcance

- Abrir Apple Maps u otras apps de mapas: el humano pidió Google Maps.
- Navegación paso a paso con origen («cómo llegar»): el enlace muestra la ubicación; la app ofrece la ruta.
- Corregir coordenadas erróneas del Ministerio.
