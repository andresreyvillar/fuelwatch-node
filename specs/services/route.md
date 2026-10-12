# Servicio: Route (geometria del corredor)

## Archivo: `src/lib/route.ts`

Funciones puras, sin Supabase. Puntos en `[lon, lat]` (GeoJSON); distancias en km. Radio terrestre 6371 km.

| Funcion | Que hace |
|---------|----------|
| `decodePolyline6(encoded)` | Polyline de OSRM con 6 decimales (pares lat, lon) → `[lon, lat][]` |
| `haversineKm(a, b)` | Distancia entre dos puntos |
| `cumulativeKm(line)` | Km desde el origen hasta cada punto |
| `chunkRanges(cumKm)` | Indices `[desde, hasta]` de tramos de `max(25 km, longitud / 30)` (≤ 30 consultas a Supabase) |
| `boxAround(points, radiusKm)` | Caja de los puntos ampliada en `radiusKm` (longitud corregida por `cos(lat)` de la latitud mas alejada del ecuador) |
| `projectSpan(line, from, to)` | Proyecta una sola vez (equirectangular, km) los puntos `from..to` alrededor del punto central del tramo, en `Float64Array` |
| `locateInSpan(point, span, cumKm)` | Distancia punto-segmento sobre el tramo proyectado, con descarte rapido de segmentos cuyos dos extremos quedan del mismo lado y mas lejos que el mejor: devuelve `{ kmRuta, desvioKm }` del segmento mas cercano |
| `simplifyForDrawing(line, cumKm)` | Un punto cada 0,5 km como minimo, con el primero y el ultimo, redondeado a 5 decimales |
| `cheapestPerSection(stations)` | `true` para la estacion de menor `price` de cada tramo `floor(kmRuta / SECTION_KM)`, `SECTION_KM = 100`; a igualdad, la primera |

Constantes: `SECTION_KM = 100`, `MIN_CHUNK_KM = 25`, `MAX_CHUNKS = 30`, `DRAWING_SPACING_KM = 0.5`.

La distancia es en linea recta a la ruta, no el desvio real por carretera.
