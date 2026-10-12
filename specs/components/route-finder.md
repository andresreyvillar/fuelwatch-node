# Componente: RouteFinder (pestana Ruta)

## Archivos

- `src/components/RouteFinder.tsx` — formulario, llamada a la API, avisos y lista. Lo carga `FuelApp` con `React.lazy`.
- `src/components/PlaceInput.tsx` — campo con autocompletado de Photon.
- `src/components/RouteMap.tsx` — mapa Leaflet (`react-leaflet`), cargado con `React.lazy` desde `RouteFinder`.

## Props de RouteFinder

```typescript
interface RouteFinderProps {
  activeFilters: string[];          // de FuelApp: decide el carburante (provinceSortFuel)
  pinnedIds: Set<number>;           // ids de favoritos, para el candado de StationCard
  onTogglePin: (station: any) => void;
}
```

## Comportamiento

1. `PlaceInput` (Origen, Destino): con 3+ caracteres y 300 ms de debounce consulta
   `https://photon.komoot.io/api/?q=...&limit=5&bbox=-18.3,27.6,4.4,43.9` y muestra solo `countrycode === 'ES'`
   como botones (`nombre, ciudad, comunidad`). Al elegir uno guarda `{ name, lon, lat }`; escribir lo borra.
2. Selector "Desvio maximo": 1, 2, 5, 10 km (por defecto 2).
3. Carburante: `provinceSortFuel(activeFilters)` (Diesel → Gasoleo A; solo Gasolina → Gasolina 95), indicado
   bajo el boton.
4. "Calcular ruta" (deshabilitado sin origen y destino): `GET /api/route-stations?from&to&radius&fuel`, con las
   coordenadas en decimal de 6 cifras (`toFixed(6)`, nunca notacion exponencial) y timeout de 20 s
   (`AbortSignal.timeout`). El resultado guarda el radio pedido para los mensajes.
   - 400 → "Elige un origen y un destino de la lista."; 404 → "No hay ruta por carretera entre esos dos puntos.";
     502 → "El servicio de rutas no responde ahora mismo. Intentalo en un rato."; otro → "No se ha podido calcular
     la ruta." (`role="alert"`).
5. Resultado: cabecera "{distanceKm} km · {h} h {min} min" y "N GASOLINERAS"; `RouteMap` (ruta en color primary, estaciones
   como `CircleMarker` (clases `.route-line`, `.route-station`, `.route-station-cheapest` de `global.css`), la mas barata del tramo en verde y mas grande, popup con rotulo, km y precio); lista `ol`
   por km con "km X · a Y km de la ruta" y "Mas barata del tramo", y `StationCard` con `stats={null}`.
6. Sin estaciones: "No hay gasolineras con precio de {carburante} a {radio} km o menos de la ruta."

## Mapa

Teselas `https://tile.openstreetmap.org/{z}/{x}/{y}.png` con atribucion de OpenStreetMap. `bounds` = la
ruta con padding 24 px; sin zoom con rueda. Altura `h-80` (`desk:h-96`).

El CSS de Leaflet se importa como URL (`leaflet/dist/leaflet.css?url`) y se pinta con
`<link rel="stylesheet" precedence="default">` (React 19 lo sube al `<head>`): solo se descarga con el mapa.

`PlaceInput` descarta las respuestas de Photon de un texto que ya ha cambiado (no pisan las sugerencias actuales).
