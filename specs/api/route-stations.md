# API: Route Stations

## Archivo: `src/pages/api/route-stations.ts`

## Endpoint

```
GET /api/route-stations?from={lon},{lat}&to={lon},{lat}&radius={km}&fuel={diesel|gas95}
```

## Parametros

| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `from` | `lon,lat` | Si | Origen (decimales con punto) dentro de Espana: lon -18.3..4.4, lat 27.6..43.9 (con Canarias, Ceuta y Melilla) |
| `to` | `lon,lat` | Si | Destino |
| `radius` | `1 \| 2 \| 5 \| 10` | Si | Desvio maximo en km (linea recta a la ruta); solo esos textos exactos (`2.0` o `02` → 400) |
| `fuel` | `diesel \| gas95` | Si | Carburante: filtra precio > 0 y decide la mas barata del tramo |

## Logica

1. Valida en orden `from`, `to`, `radius`, `fuel`; el primero invalido responde 400 `{ "error": "Invalid <param>" }`.
2. Llama a `findStationsAlongRoute(from, to, radius, fuel)` de `lib/fuel.ts`:
   1. `GET https://router.project-osrm.org/route/v1/driving/{from};{to}?overview=full&geometries=polyline6&steps=true`,
      abortado a los 10 s (`OSRM_TIMEOUT_MS`), con `User-Agent: FuelWatch/1.0 (+https://fuelwatch.pages.dev)`
      (OSRM responde 403 sin esa cabecera y el `fetch` de Cloudflare Workers no la pone). La geometria llega codificada (`decodePolyline6`) y los pasos traen
      el modo de cada tramo.
      - `code` `NoRoute` o `NoSegment`, o algun `waypoints[].distance` > 5000 m (`MAX_SNAP_METERS`: OSRM engancha
        el punto a la carretera mas cercana aunque este a cientos de km, p. ej. Canarias → Portugal) →
        `RouteNotFoundError`. Tambien si algun paso tiene `mode: 'ferry'` (decision del humano: con barco no es
        "por carretera") o la ruta supera 1.600 km (`MAX_ROUTE_METERS`).
      - Error de red o timeout, respuesta no OK, `code` distinto de `Ok` o ruta sin geometria (< 2 puntos) →
        `RoutingUnavailableError`.
   2. Km acumulados de la linea (`cumulativeKm`) y tramos de consulta (`chunkRanges`: max(25 km, longitud / 30)).
   3. Por tramo (en paralelo): `servicestations` con `latitud`/`longitud` dentro de `boxAround(tramo, radius)` y
      `{columna del carburante} > 0` (`PROVINCE_SORT_COLUMNS`).
   4. Cada estacion se mide solo contra el tramo de su caja (`projectSpan` + `locateInSpan`): si esta a ≤ radio de
      un segmento de otro tramo, tambien cae en la caja de ese tramo y se mide alli. Se descarta si
      `desvioKm > radius`; si aparece en varias cajas, se queda la posicion con menor desvio.
   5. Orden por `kmRuta`; se redondean `kmRuta` y `desvioKm` a 2 decimales y despues `cheapestPerSection` marca la
      mas barata de cada tramo de 100 km (con el km ya redondeado, el que se devuelve).
3. `RouteNotFoundError` → 404 `{ "error": "No route" }`; `RoutingUnavailableError` → 502
   `{ "error": "Routing unavailable" }`; otro error → 500 `{ "error": mensaje }`.

## Respuesta exitosa (200)

Cabecera `Cache-Control: public, max-age=3600` (la CDN no repite la llamada a OSRM durante una hora).

```json
{
  "route": { "distanceKm": 591.2, "durationMin": 352, "geometry": [[-8.7207, 42.2406], [-8.71, 42.24]] },
  "stations": [
    {
      "id_ss": 1234, "rotulo": "REPSOL", "localidad": "OURENSE", "latitud": 42.33, "longitud": -7.86,
      "precio_diesel": 1.699, "precio_gasolina_95": 1.779, "...": "resto de columnas de servicestations",
      "kmRuta": 95.12, "desvioKm": 0.84, "masBarataDelTramo": true
    }
  ]
}
```

- `geometry`: ruta simplificada para dibujar (un punto cada 0,5 km como minimo, 5 decimales).
- `kmRuta` y `desvioKm` redondeados a 2 decimales.
- Coste medido (en local, con las 12.465 estaciones): Vigo → Madrid 1-4 ms de CPU de calculo; Cadiz → Girona con 10 km de desvio unos 18 ms.
- No incluye `trend` (sin `attachTrends`).

## Dependencias

- `findStationsAlongRoute()`, `RouteNotFoundError`, `RoutingUnavailableError` de `lib/fuel.ts`
- `lib/route.ts` (ver `specs/services/route.md`)
- Requiere `latitud`/`longitud` numericas (migracion `supabase/coordenadas-numericas.sql`)
